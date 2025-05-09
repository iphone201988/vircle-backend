import userRouter from "./user.routes";
import express from "express";
import aiContactRouter from "./aiContact.routes";
import chatRouter from "./chat.routes";
import contactRouter from "./contact.routes";
const router = express.Router();

router.use("/user", userRouter);

router.use("/aiContact", aiContactRouter);

router.use("/chat", chatRouter);

router.use("/contact", contactRouter);

export default router;
