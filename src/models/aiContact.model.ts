import mongoose, { Schema } from "mongoose";
import { gender } from "../utils/enums";
import { AiContactModel } from "../type/Database/types";

const aiContactSchema = new mongoose.Schema<AiContactModel>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
    },
    age: {
      type: Number,
      max: 99,
    },
    gender: {
      type: String,
      enum: [gender.MALE, gender.FEMALE, gender.OTHER],
      default: gender.OTHER,
    },
    relationship: {
      type: String,
      maxlength: 50,
      trim: true,
    },
    expertise: {
      type: String,
      maxlength: 50,
      trim: true,
    },
    languagePreference: {
      type: String, 
      maxlength: 30,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    canTextEvery: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly", "Yearly", "Never"],
      default: "Never",
    },
    aiAvatar: {
      type: String,
      default: "",
    },
    personaContext: {
      type: String,
      default: "",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<AiContactModel>("AiContact", aiContactSchema);