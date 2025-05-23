import { AnyConnectionBulkWriteModel, Document, Types } from "mongoose";
export type RegisterUserRequest = {
    name: string;
    email: string;
    password: string;
    deviceToken: string;
    deviceType: number;
  };


export interface UserModel extends Document {
    socialId?: string;
    socialType: number;
    name: string;
    email: string;
    jti?: string;
    password: string;
    deviceToken: string;
    deviceType: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    matchPassword(password: string): Promise<boolean>;
    isActive: boolean;

    //PROFILE FIELDS
    age:number,
    gender:string
    personal_details:string,
    avatar:string,
    notification:boolean
  }


  export interface AiContactModel extends Document {
    userId: Types.ObjectId;
    name: string;
    age?: number;
    gender: string;
    relationship?: string; 
    expertise?: string; 
    languagePreference?: string; 
    description?: string; 
    canTextEvery: string; 
    aiAvatar?: string; 
    personaContext?: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
  }

  export interface ChatModel extends Document {
    userId: any;
    contactId: any;
    lastMessage:any;
    hasUnreadMessages: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface ContactModel extends Document {
    userId: Types.ObjectId;
    name: string;
    email: string;
    message: string;
  }


  export interface MessageModel extends Document {
    chatId: any;
    aiContactId: any;
    userId:any;
    type: string;
    message: string;
    isRead: boolean;
  }    
  
  
  export interface IReminder extends Document {
    userId: any;
    chatId: any;
    reminderDate: Date;
    task: string;
    isSent: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
