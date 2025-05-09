import AiContact from "../models/aiContact.model";
import { buildPersonaPrompt } from "../utils/promptBuilder";
import { createPersona } from "../services/gpt.service";
import { TryCatch, SUCCESS, filterAiContaxt } from "../utils/helper";
import { NextFunction, Request, Response } from "express";
import Chat from "../models/chat.model";
import ErrorHandler from "../utils/ErrorHandler";

const addAiContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const aiAvatar = req.file;
    const contactData = req.body;

    const prompt = await buildPersonaPrompt(contactData);

    const result = await createPersona(prompt);
    
    if (!result.success) {
      return next(new ErrorHandler(result.message, 400));
    }
    contactData.personaContext = result.personaDetails
      ? result.personaDetails
      : "";
    contactData.userId = userId;

    contactData.aiAvatar = aiAvatar?.filename
      ? `uploads/${aiAvatar.filename}`
      : "";

    const existingContact = await AiContact.findOne({
      userId,
      name: contactData.name,
    });
    if (existingContact) {
      return next(
        new ErrorHandler(
          `You have already created Ai contact with this ${contactData.name}`,
          400
        )
      );
    }
    const newContact = await AiContact.create(contactData);

    const existingChat = await Chat.findOne({
      userId,
      contactId: newContact._id,
    });

    if (!existingChat) {
      await Chat.create({
        userId,
        contactId: newContact._id,
        lastMessage: null,
        hasUnreadMessages: false,
      });
    }

    return SUCCESS(res, 200, "AI contact created successfully", {
      data: {
        contact: filterAiContaxt(newContact),
      },
    });
  }
);

const getAiContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const contacts = await AiContact.find({ userId, isDeleted: false }).select(
      "-__v -personaContext"
    );
    return SUCCESS(res, 200, "AI contact fetched successfully", {
      data: {
        contacts,
      },
    });
  }
);

const updateAiContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req;
    const { aiContactId } = req.params;

    if (!userId || !aiContactId) {
      return next(new ErrorHandler("Missing user or AI contact ID", 400));
    }

    const aiContact = await AiContact.findOne({ _id: aiContactId, userId });
    if (!aiContact) {
      return next(new ErrorHandler("AI contact not found", 404));
    }

    const {
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

export default {
  addAiContact,
  getAiContact,
  updateAiContact,
};
