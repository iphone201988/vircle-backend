import Joi from "joi";
import { emailValidation, ObjectIdValidation, passwordValidation, stringValidation } from ".";

const loginAdminSchema = {
  body: Joi.object({
    email: emailValidation(),
    password: passwordValidation(),
  }),
};

const commonParamsSchema  = {
  params: Joi.object({
    userId: ObjectIdValidation("UserID"),
  })
}


export default {
  loginAdminSchema,
  commonParamsSchema
};