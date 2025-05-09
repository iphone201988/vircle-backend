import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { get_encoding } from "tiktoken";
import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const TryCatch =
  (func: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(func(req, res, next)).catch(next);

  import mongoose from "mongoose";
import { UserModel } from "../type/Database/types";


  
  export const connectDB = async () => {
      try {
          const conn = await mongoose.connect(process.env.MONGO_URI!);
          console.log(`MongoDB Connected: ${conn.connection.host}`);
      } catch (error) {
          console.log(error);
          process.exit(1);
      }
  };
  

  export const generateRandomString = (length: number): string => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(){}[]:;<>+=?/|";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  export const generateJwtToken = (payload: any) => {
    // { expiresIn: "1d" }
    return jwt.sign(payload, process.env.JWT_SECRET);
  };

  type ResponseData = Record<string, any>;
  export const SUCCESS = (
    res: Response,
    status: number,
    message: string,
    data?: ResponseData
  ): ResponseData => {
    return res.status(status).json({
      success: true,
      message,
      ...(data ? data : {}),
    });
  };

  export const filterUser = (user: Partial<UserModel>) => {
    if (!user) return null;
  
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      personal_details: user.personal_details,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      notification:user.notification
    };
  };

  export const filterAiContaxt = (aiContaxt: any) => {
    if (!aiContaxt) return null;
  
    return {
      _id: aiContaxt._id,
      name: aiContaxt.name,
      age: aiContaxt.age,
      gender: aiContaxt.gender,
      relationship: aiContaxt.relationship,
      expertise: aiContaxt.expertise,
      languagePreference: aiContaxt.languagePreference,
      description: aiContaxt.description,
      canTextEvery: aiContaxt.canTextEvery,
      aiAvatar: aiContaxt.aiAvatar,
      // personaContext: aiContaxt.personaContext,
      createdAt: aiContaxt.createdAt,
      updatedAt: aiContaxt.updatedAt,
      isDeleted: aiContaxt.isDeleted,
    };
  };

  export const countTokens = async (text: string) => {
    const encoding = get_encoding("cl100k_base");
    const tokens = encoding.encode(text);
    return tokens.length;
  };

  export const moderateContent = async (text: string) => {
    const moderation = await openai.moderations.create({ input: text });
    return { isSafe: !moderation.results[0].flagged };
  };