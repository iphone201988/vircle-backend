import express from "express";
import userController from "../controllers/user.controller";
import validate from "../middleware/validate.middleware";
import userSchema from "../schema/user.schema";
import upload from "../middleware/multer.middleware";
import { authenticationMiddleware } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post(
  "/register",
  validate(userSchema.userRegisterSchema),
  userController.registerUser
);
userRouter.post(
  "/login",
  validate(userSchema.loginSchema),
  userController.userLogin
);
userRouter.put(
  "/changePassword",
  authenticationMiddleware,
  validate(userSchema.resetPasswordSchema),
  userController.resetPassword
);
userRouter.put(
  "/updateProfile",
  authenticationMiddleware,
  upload.single("avatar"),
  validate(userSchema.updateProfileSchema),
  userController.updateProfile
);

userRouter.get(
  "/getUser",
  authenticationMiddleware,
  userController.getUserProfile
);

userRouter.post(
  "/socialLogin",
  validate(userSchema.socialLoginSchema),
  userController.socialLogin
);

userRouter.get('/logout', authenticationMiddleware,userController.logOut)

userRouter.delete("/", authenticationMiddleware, userController.removeAccount);

export default userRouter;
