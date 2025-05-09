import Joi, { bool } from "joi";
import { emailValidation, stringValidation } from ".";

const contactSchema = {
  body: Joi.object({
    name: stringValidation("name", true),
    email: emailValidation(),
    message: stringValidation("message", true),
  }),
};



export default {
  contactSchema,
};