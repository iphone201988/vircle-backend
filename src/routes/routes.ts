import userRouter from "./user.routes";
import express from "express";
import aiContactRouter from "./aiContact.routes";
import chatRouter from "./chat.routes";
import contactRouter from "./contact.routes";
import adminRouter from "./admin.routes";
const router = express.Router();

router.use("/user", userRouter);

router.use("/aiContact", aiContactRouter);

router.use("/chat", chatRouter);

router.use("/contact", contactRouter);

router.use("/admin", adminRouter);

export default router;
