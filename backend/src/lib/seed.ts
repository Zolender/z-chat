import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from './mongoose'
import {Room} from '../models/Room'

const predifinedRooms = [
    {name: 'general', description: 'General discussion'},
    {name: 'random', description: 'Anything goes'},
    {name: 'announcements', description: 'Important updates'}
]

async function seed(){
    await connectDB()
    for(const room of predifinedRooms){
        await Room.updateOne(
            {name: room.name, type: 'PREDIFINED'},
            {$setOnInsert: {...room, type: 'PREDEFINED', createdById: null}},
            {upsert: true}
        )
    }
    console.log('Seeded predefined rooms')
    await mongoose.disconnect()
}

seed().catch(err=>{
    console.error('Seed failed: ', err)
    process.exit(1)
})