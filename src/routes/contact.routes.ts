import express from "express";
import contactController from "../controllers/contact.controller";
import validate from "../middleware/validate.middleware";
import contactSchema from "../schema/contact.schema";
import { authenticationMiddleware } from "../middleware/auth.middleware";
const contactRouter = express.Router();

contactRouter.post(
    "/addContact",
    authenticationMiddleware,
    validate(contactSchema.contactSchema),
    contactController.addContact
);

export default contactRouter;