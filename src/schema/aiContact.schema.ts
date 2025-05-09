import Joi from "joi";
import { stringValidation } from ".";
import { gender } from "../utils/enums";

const aiContactSchema = {
  body: Joi.object({
    name: stringValidation("name", true).max(50).trim(),
    age: Joi.number().min(0).max(99).messages({
      "number.base": "Age must be a number",
      "number.min": "Age cannot be negative",
      "number.max": "Age must be less than or equal to 99",
    }),
    gender: Joi.string()
      .valid(gender.MALE, gender.FEMALE, gender.OTHER)
      .default(gender.OTHER),
    relationship: Joi.string().max(50).trim().optional(),
    expertise: Joi.string().max(50).trim().optional(),
    languagePreference: Joi.string().max(30).trim().optional(),
    description: Joi.string().max(1000).trim().optional(),
    canTextEvery: Joi.string()
      .valid("Daily", "Weekly", "Monthly", "Yearly", "Never")
      .default("Never"),
  }),
};

const updateAiContactSchema = {
  body: Joi.object({
    name: stringValidation("name", false).max(50).trim(),
    age: Joi.number().min(0).max(99).messages({
      "number.base": "Age must be a number",
      "number.min": "Age cannot be negative",
      "number.max": "Age must be less than or equal to 99",
    }),
    gender: Joi.string()
      .valid(gender.MALE, gender.FEMALE, gender.OTHER)
      .default(gender.OTHER),
    relationship: Joi.string().max(50).trim().optional(),
    expertise: Joi.string().max(50).trim().optional(),
    languagePreference: Joi.string().max(30).trim().optional(),
    description: Joi.string().max(1000).trim().optional(),
    canTextEvery: Joi.string()
      .valid("Daily", "Weekly", "Monthly", "Yearly", "Never")
      .default("Never"),
  }),
};

export default {
  aiContactSchema,
  updateAiContactSchema
};
