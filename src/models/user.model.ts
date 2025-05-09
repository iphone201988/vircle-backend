import mongoose from "mongoose";
import { deviceType, gender, socialTypeEnums } from "../utils/enums";
import bcrypt from "bcrypt";
import { UserModel } from "../type/Database/types";

const userSchema = new mongoose.Schema<UserModel>(
  {
    socialId: { type: String },
    socialType: {
      type: Number,
      enum: Object.values(socialTypeEnums),
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    jti: { type: String },
    password: {
      type: String,
    },
    deviceToken: { type: String, require: true },
    deviceType: {
      type: Number,
      enum: [deviceType.IOS, deviceType.ANDROID],
    },
    isDeleted: { type: Boolean, default: false },

    //PROFILE FIELDS
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: [gender.MALE,gender.FEMALE,gender.OTHER],
      default:gender.OTHER
    },
    personal_details:{
      type:String,
    },
    avatar:{
      type:String
    },
    notification:{
      type:Boolean
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
});

userSchema.methods.matchPassword = async function (password: string) {
  if (!this.password) return false;
  const isCompared = await bcrypt.compare(password, this.password);
  return isCompared;
};

const User = mongoose.model<UserModel>("User", userSchema);
export default User;
