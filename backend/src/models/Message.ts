import mongoose, {Document, Schema, Types} from 'mongoose'

export interface IMessage extends Document {
    content: string
    userId: Types.ObjectId
    roomId: Types.ObjectId
    createdAt: Date
}


const messageSchema = new Schema<IMessage>(
    {
        content: {type: String, required: true},
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        roomId: {type: Schema.Types.ObjectId, ref: "Room", required: true}
    },
    {timestamps: {createdAt: true, updatedAt: false}}
)

export const Message = mongoose.model<IMessage>("Message", messageSchema)