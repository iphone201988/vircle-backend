import { NextFunction, Request, Response } from "express";
import {
  filterAiContaxt,
  filterUser,
  generateJwtToken,
  getPercentage,
  SUCCESS,
  TryCatch,
} from "../utils/helper";
import Contact from "../models/contact.model";
import User from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import AiContact from "../models/aiContact.model";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { buildPersonaPrompt } from "../utils/promptBuilder";
import { createPersona } from "../services/gpt.service";
import Chat from "../models/chat.model";

const adminLogin = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("admin login");
    const { email, password } = req.body;

    if (email != process.env.ADMIN_EMAIL)
      return next(
        new ErrorHandler("You are not authorized to access the route ", 401)
      );
    let user;
    if (email) user = await User.findOne({ email });

    if (!user) return next(new ErrorHandler("User not found", 400));

    const isPasswordMatched = await user.matchPassword(password);

    if (!isPasswordMatched)
      return next(new ErrorHandler("Invalid password", 400));

    const token = generateJwtToken({ userId: user._id });
    return SUCCESS(res, 200, "LoggedIn successfully", {
      data: {
        token: token ? token : undefined,
        user: filterUser(user),
      },
    });
  }
);

const getAllUsers = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({
       isDeleted: false,
      _id: { $ne: req.userId },
    }).select("-__v -password -jti -deviceToken -deviceType");

    const usersWithAiAccountCount = await Promise.all(
      users.map(async (user) => {
        const aiAccountCount = await AiContact.countDocuments({
          userId: user._id,
        });
        return { ...user.toObject(), aiAccountCount };
      })
    );

    return SUCCESS(res, 200, "Users fetched successfully", {
      data: {
        users: usersWithAiAccountCount,
      },
    });
  }
);

const getUserById = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-__v -password -jti");
    return SUCCESS(res, 200, "User fetched successfully", {
      data: {
        user,
      },
    });
  }
);

const deleteUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    user.isDeleted = true;
    await user.save();
    return SUCCESS(res, 200, "User deleted successfully");
  }
)

const activateOrDeactivateUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const user = await User.findById(userId);
     if(user.isActive){
      user.jti = null;
      user.deviceToken = null;
      user.deviceType = null;
    }
    user.isActive = !user.isActive;
   
    await user.save();
    return SUCCESS(res, 200, "User updated successfully");
  }
)

const getAllAiContacts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const AiContacts = await AiContact.find({ isDeleted: false }).select(
      "-__v"
    );
    return SUCCESS(res, 200, "Users fetched successfully", {
      data: {
        AiContacts,
      },
    });
  }
);

const getAiContactById = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { contactId } = req.params;
    const contact = await AiContact.findById(contactId).select("-__v");
    return SUCCESS(res, 200, "AI contact fetched successfully", {
      data: {
        contact,
      },
    });
  }
);

const getAnalysticsInsights = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const currentDate = new Date();
    const startOfThisMonth = startOfMonth(currentDate);
    const startOfLastMonth = startOfMonth(subMonths(currentDate, 1));
    const endOfLastMonth = endOfMonth(subMonths(currentDate, 1));
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const [
      totalUsers,
      totalAiContacts,
      newUsersThisMonth,
      newUserLastMonth,
      mewAiContactsThisMonth,
      newAiContactsLastMonth,
    ] = await Promise.all([
      User.countDocuments({
        isDeleted: false,
        email: { $ne: process.env.ADMIN_EMAIL },
      }),
      AiContact.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: startOfThisMonth, $lte: currentDate },
      }),
      User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      AiContact.countDocuments({
        createdAt: { $gte: startOfThisMonth, $lte: currentDate },
      }),
      AiContact.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
    ]);

    const userPercentage = getPercentage(newUserLastMonth, newUsersThisMonth);
    const aiPercentage = getPercentage(
      newAiContactsLastMonth,
      mewAiContactsThisMonth
    );

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const userGrowth = [];

    for (let month = 0; month <= currentMonth; month++) {
      const start = new Date(currentYear, month, 1);
      const end = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);

      const [userCount, aiContactCount] = await Promise.all([
        User.countDocuments({
          email: { $ne: process.env.ADMIN_EMAIL },
          createdAt: { $gte: start, $lte: end },
        }),
        AiContact.countDocuments({
          createdAt: { $gte: start, $lte: end },
        }),
      ]);

      userGrowth.push({
        month: monthNames[month],
        user: userCount,
        aiContact: aiContactCount,
      });
    }

    return SUCCESS(res, 200, "AI contact fetched successfully", {
      data: {
        totalUsers,
        totalAiContacts,
        userPercentageFromLastMonth: userPercentage,
        aiPercentageFromLastMonth: aiPercentage,
        userGrowth
      },
    });
  }
);

const updateAiContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const { id } = req.params;
    if (!userId || !id) {
      return next(new ErrorHandler("Missing user or AI contact ID", 400));
    }

    const aiContact = await AiContact.findOne({ _id: id });
    if (!aiContact) {
      return next(new ErrorHandler("AI contact not found", 404));
    }

    let {
      name,
      age,
      gender,
      relationship,
      expertise,
      languagePreference,
      description,
      canTextEvery,
    } = req.body;

    // Check if the name has changed and is already used
    if (name && name !== aiContact.name) {
      const existingContact = await AiContact.findOne({ userId, name });
      if (existingContact) {
        return next(
          new ErrorHandler(
            `You have already created an AI contact with the name "${name}"`,
            400
          )
        );
      }
    }

    let personaContext = aiContact.personaContext;
    try {
      const prompt = await buildPersonaPrompt(req.body);
      const result = await createPersona(prompt);
      if (!result.success) {
        return next(
          new ErrorHandler(result.message || "Persona creation failed", 400)
        );
      }
      personaContext = result.personaDetails || "";
    } catch (err: any) {
      return next(new ErrorHandler("Failed to build or create persona", 500));
    }
    gender = gender === "Other" ? "OTHER" : gender == "Male" ? "male" : gender == " Female" ? "female" : gender;
    const aiAvatar = req.file;
    aiContact.name = name ?? aiContact.name;
    aiContact.age = age ?? aiContact.age;
    aiContact.gender = gender ?? aiContact.gender;
    aiContact.relationship = relationship ?? aiContact.relationship;
    aiContact.expertise = expertise ?? aiContact.expertise;
    aiContact.languagePreference =
      languagePreference ?? aiContact.languagePreference;
    aiContact.description = description ?? aiContact.description;
    aiContact.canTextEvery = canTextEvery ?? aiContact.canTextEvery;
    aiContact.personaContext = personaContext;
    if (aiAvatar?.filename) {
      aiContact.aiAvatar = `uploads/${aiAvatar.filename}`;
    }

    await aiContact.save();

    return SUCCESS(res, 200, "AI contact updated successfully", {
      data: {
        contact: filterAiContaxt(aiContact),
      },
    });
  }
);


const deleteAiContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const contact = await AiContact.findById(id);
    const chat = await Chat.findOne({ contactId: id });
    if (!contact) {
      return next(new ErrorHandler("AI contact not found", 404));
    }
    if(chat) {
      chat.isDeleted = true;
      await chat.save();
    }
    contact.isDeleted = true;
    await contact.save();
    return SUCCESS(res, 200, "AI contact deleted successfully");
  }
)

const getContacts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const contacts = await Contact.find()
    return SUCCESS(res, 200, "AI contact fetched successfully", {
      data: {
        contacts,
      },
    });
  }
)

export default {
  getAllUsers,
  adminLogin,
  getUserById,
  getAllAiContacts,
  getAiContactById,
  getAnalysticsInsights,
  deleteUser,
  activateOrDeactivateUser,
  updateAiContact,
  deleteAiContact,
  getContacts
};
