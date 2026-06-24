import mongoose, {Document, Schema, Types} from 'mongoose'

export interface IRoomMember extends Document {
    userId: Types.ObjectId
    roomId: Types.ObjectId
    joinedAt: Date
}

const roomMemberSchema = new Schema<IRoomMember>(
    {
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
        roomId: {type: Schema.Types.ObjectId, ref: "Room", required: true},
        joinedAt: {type: Date, default: Date.now}
    }
)

roomMemberSchema.index({userId: 1, roomId: 1}, {unique: true})

export const RoomMember = mongoose.model<IRoomMember>("RoomMember", roomMemberSchema)