import Joi, { string } from "joi";
import { emailValidation, passwordValidation, stringValidation } from ".";
import { deviceType, gender, socialTypeEnums } from "../utils/enums";

const userRegisterSchema = {
  body: Joi.object({
    name: stringValidation("name", true),
    email: emailValidation(),
    password: passwordValidation(),
    deviceToken: stringValidation("Device Token"),
    deviceType: Joi.number()
      .valid(...Object.values(deviceType))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
  }),
};

const updateProfileSchema = {
  body: Joi.object({
    name: stringValidation("name", false),
    age: Joi.number().min(10),
    gender: Joi.string().valid(gender.MALE, gender.FEMALE, gender.OTHER),
    personal_details: stringValidation("personal_details", false),
    notification: Joi.boolean(),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: emailValidation(),
    password: passwordValidation(),
    deviceToken: stringValidation("Device Token"),
    deviceType: Joi.number()
      .valid(...Object.values(deviceType))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    oldPassword: passwordValidation("Old Password"),
    newPassword: passwordValidation(),
  }),
};


const socialLoginSchema = {
  body: Joi.object({
    socialId: stringValidation("Social ID"),
    email: emailValidation(),
    name: stringValidation("Name"),
    avatar: stringValidation("Avatar",false),
    socialType: Joi.number()
      .valid(...Object.values(socialTypeEnums))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
    deviceToken: stringValidation("Device Token"),
    deviceType: Joi.number()
      .valid(...Object.values(deviceType))
      .required()
      .messages({
        "number.base": `Device Type must be a number.`,
        "any.only": `Device Type must be one of: ${Object.values(
          deviceType
        ).join(", ")}.`,
        "any.required": `Device Type is required.`,
      }),
  }),
};


export default {
  userRegisterSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
  socialLoginSchema
};
