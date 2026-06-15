import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document{
    username: string
    email: string
    passwordHash: string
    refreshToken?: string | null
    createdAt: Date
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String, 
            required: true,
            unique: true
        },
        email: {
            type: String, 
            required: true,
            unique: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        refreshToken: {
            type: String,
            default: null
        }
    },
    {timestamps: {createdAt: true, updatedAt: false}}
)

export const User = mongoose.model<IUser>("User", userSchema)