import express from "express";
import aiContactController from "../controllers/aiContact.controller";
import { authenticationMiddleware } from "../middleware/auth.middleware";
import aiContactSchema from "../schema/aiContact.schema";
import validate from "../middleware/validate.middleware";
import upload from "../middleware/multer.middleware";

const aiContactRouter = express.Router();

aiContactRouter.post(
  "/addAiContact",
  authenticationMiddleware,
  upload.single('aiAvatar'),
  validate(aiContactSchema.aiContactSchema),
  aiContactController.addAiContact
);

aiContactRouter.get(
  "/getAiContact",
  authenticationMiddleware,
  aiContactController.getAiContact
);

aiContactRouter.put(
  "/updateAiContact/:aiContactId",
  authenticationMiddleware,
  upload.single('aiAvatar'),
  validate(aiContactSchema.updateAiContactSchema),
  aiContactController.updateAiContact
);


export default aiContactRouter;
