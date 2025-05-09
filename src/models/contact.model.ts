import mongoose from "mongoose";
import { ContactModel } from "../type/Database/types";


const contactSchema = new mongoose.Schema<ContactModel>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message:{
    type: String,
    required: true,
  }
});

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;

