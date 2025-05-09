import Contact from "../models/contact.model";
import { SUCCESS, TryCatch } from "../utils/helper";
import { NextFunction, Request, Response } from "express";

const addContact = TryCatch(
    async (req: Request, res: Response, next: NextFunction) => {
        const {userId } = req;
        const { name, email, message } = req.body;
        const contact = await Contact.create({ userId, name, email, message });
        return SUCCESS(res, 200, "Contact added successfully");   
    }
);

export default {
    addContact,
};