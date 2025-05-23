import { NextFunction, Request, Response } from "express";
import {
  TryCatch,
  generateRandomString,
  generateJwtToken,
  SUCCESS,
  filterUser,
} from "../utils/helper";
import { RegisterUserRequest } from "../type/Database/types";
import User from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { SocilLoginRequest } from "../type/Api/user.type";
import path from "path";
const registerUser = TryCatch(
  async (
    req: Request<{}, {}, RegisterUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, password, deviceToken, deviceType } = req.body;

    const ExistingUser = await User.findOne({ email });

    if (ExistingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      name,
      email:email.toLowerCase(),
      password,
      deviceToken,
      deviceType,
    });
    const jti = generateRandomString(20);
    const token = generateJwtToken({ userId: user._id, jti });
    user.jti = jti;
    user.save();
    return SUCCESS(res, 201, "User Registered successfully", {
      data: {
        token: token ? token : undefined,
        user: filterUser(user),
      },
    });
  }
);

const userLogin = TryCatch(
  async (
    req: Request<{}, {}, RegisterUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password, deviceToken, deviceType } = req.body;

    const user = await User.findOne({ email, isDeleted: false });

    if (!user) return next(new ErrorHandler("User not found", 400));
    if(!user.isActive) return next(new ErrorHandler("Your account is deactivated", 400));


    const isPasswordMatched = await user.matchPassword(password);

    if (!isPasswordMatched)
      return next(new ErrorHandler("Invalid password", 400));

    const jti = generateRandomString(20);
    const token = generateJwtToken({ userId: user._id, jti });
    user.jti = jti;
    user.deviceToken = deviceToken;
    user.deviceType = deviceType;
    user.save();

    return SUCCESS(res, 200, "LoggedIn successfully", {
      data: {
        token: token ? token : undefined,
        user: filterUser(user),
      },
    });
  }
);

const resetPassword = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    const { oldPassword, newPassword } = req.body;
    const isMatched = await user.matchPassword(oldPassword);
    console.log(isMatched);
    if (!isMatched)
      return next(new ErrorHandler("Old password is incorrect", 400));

    user.password = newPassword;
    await user.save();
    return SUCCESS(res, 200, "Password changed successfully");
  }
);

const updateProfile = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, userId } = req;
    const { name, age, gender, personal_details,notification } = req.body;
    const avatar = req.file;
  
    const logdinUser = await User.findById(userId);

    if (!logdinUser) return next(new ErrorHandler("User Not Found", 400));

    logdinUser.name = name ? name : logdinUser.name;
    logdinUser.age = age ? age : logdinUser.age;
    logdinUser.gender = gender ? gender : logdinUser.gender;
    logdinUser.personal_details = personal_details
      ? personal_details
      : logdinUser.personal_details;
    logdinUser.avatar = avatar?.filename
      ? `uploads/${avatar.filename}`
      : logdinUser.avatar;

    logdinUser.notification = notification
    logdinUser.save();
    return SUCCESS(res, 200, "Profile Updated Successfully", {
      data: {
        user: filterUser(logdinUser),
      },
    });
  }
);

const getUserProfile = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;

    const logdinUser = await User.findById(userId);
    if (!logdinUser) return next(new ErrorHandler("User Not Found", 400));

    return SUCCESS(res, 200, "User Fetched Successfully", {
      data: {
        user: filterUser(logdinUser),
      },
    });
  }
);

const socialLogin = TryCatch(
  async (
    req: Request<{}, {}, SocilLoginRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      name,
      socialId,
      email,
      socialType,
      avatar,
      deviceToken,
      deviceType,
    } = req.body;

    let user = await User.findOne({
      socialId,
      email,
      isDeleted: false,
    });

    if (!user) {
      user = await User.create({
        name,
        email,
        socialId,
        socialType,
      });
    }

    user.deviceToken = deviceToken;
    user.deviceType = deviceType;
    if (avatar) user.avatar = avatar;

    const jti = generateRandomString(20);
    user.jti = jti;
    let token = generateJwtToken({ userId: user._id, jti });

    await user.save();
    let updatedAvatar = null;
    if (user?.avatar) {
      if (user.avatar.includes("https")) {
        updatedAvatar = user.avatar;
      } else {
        updatedAvatar = process.env.AWS_S3_URI + user.avatar;
      }
    }

    return SUCCESS(res, 200, "User logged in successfully", {
      data: {
        token: token ? token : null,
        user: { ...filterUser(user.toObject()), avatar: updatedAvatar },
      },
    });
  }
);

const logOut = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const user = await User.findById(userId);
    user.deviceToken = null;
    user.deviceType = null;
    user.jti = null;
    await user.save();
    return SUCCESS(res, 200, "User logged out successfully");
  }
);

const removeAccount = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    user.isDeleted = true;
    await user.save();
    return SUCCESS(res, 200, "User account deleted successfully");
  }
);

export default {
  registerUser,
  userLogin,
  resetPassword,
  updateProfile,
  getUserProfile,
  socialLogin,
  logOut,
  removeAccount
};
