import mongoose, {Document, Schema, Types} from "mongoose";

export type RoomType = 'PREDIFINED' | 'USER_CREATED' | 'DIRECT'

export interface IRoom extends Document {
    name: string
    description?: string
    type: RoomType
    createdById?: Types.ObjectId | null
    createdAt: Date
}

const roomSchema = new Schema<IRoom>(
    {
        name: { type : String, required: true},
        description: {type: String},
        type: {
            type: String,
            enum:['PREDIFINED', 'USER_CREATED', 'DIRECT'],
            default: 'USER_CREATED'
        },
        createdById: {type: Schema.Types.ObjectId, ref: 'User', default: null}
    },
    {timestamps: {createdAt: true, updatedAt: false}}
)

export const Room = mongoose.model<IRoom>("Room", roomSchema)