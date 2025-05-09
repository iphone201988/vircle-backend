import express from "express";
import chatController from "../controllers/chat.controller";
import { authenticationMiddleware } from "../middleware/auth.middleware";
const chatRouter = express.Router();

// chatRouter.post("/sendMessage",authenticationMiddleware,chatController.sendMessage );

chatRouter.get(
  "/getChats",
  authenticationMiddleware,
  chatController.getChats
);

chatRouter.get(
  "/getChatMessages/:chatId",
  authenticationMiddleware,
  chatController.getChatMessages
)
export default chatRouter;
