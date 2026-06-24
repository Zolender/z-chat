import {Router, Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import {User} from '../models/User'
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../lib/jwt'

const router = Router()

router.post('register', async (req: Request, res: Response)=>{
    try{
        const {username, email, password} = req.body
        if(!username || !email || !password){
            res.status(400).json({message: 'username, email and password are required'})
            return
        }

        const existing = await User.findOne({$or: [{email}, {username}]})
        if(existing){
            return res.status(409).json({message: "Username or email already taken"})
        }
        const passwordHash = await bcrypt.hash(password, 10)
        const user = await User.create({
            username, 
            email,
            passwordHash
        })

        const accessToken = signAccessToken({userId: user.id, username, email})
        const refreshToken = signRefreshToken({userId: user.id})
        user.refreshToken = refreshToken
        await user.save()

        res.status(201).json({
            accessToken, refreshToken,
            user: {id: user.id, username, email}
        })
    }catch(err){
        console.error(err)
        res.status(500).json({message: 'Internal server error'})
    }
})

router.post('/login', async (req: Request, res: Response)=>{
    try{
        const {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({message: 'email and password are required'})
        }

        const user = await User.findOne({email})
        if(!user){
            return res.status(401).json({message: 'Invalid credentials'})
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if(!valid){
            res.status(401).json({message: "Invalid credentials"})
            return
        }

        const accessToken = signAccessToken({userId: user.id, username: user.username, email: user.email})
        const refreshToken = signRefreshToken({userId: user.id})

        user.refreshToken = refreshToken
        await user.save()

        res.json({
            accessToken, refreshToken, user: {id: user.id, username: user.username, email: user.email}
        })
    }catch(err){
        console.error(err)
        res.status(500).json({message: 'Internal server error'})
    }
})

router.post('/refresh', async(req: Request, res: Response)=>{
    try{
        const {refreshToken} = req.body
        if(!refreshToken){
            res.status(400).json({message: 'refreshToken is required'})
            return
        }

        const payload = verifyRefreshToken(refreshToken)
        const user = await User.findById(payload.userId)

        if(!user || user.refreshToken !== refreshToken){
            res.status(401).json({message: 'Invalid refresh token'})
            return
        }

        const accessToken = signAccessToken({userId: user.id, username: user.username, email: user.email})
        res.json({accessToken})
    }catch(err){
        console.error(err)
        res.status(401).json({message: 'Invalid refresh token'})
    }
})

router.post('/logout', async(req: Request, res: Response)=>{
    try{
        const {refreshToken} = req.body
        if(!refreshToken){
            res.status(400).json({message: 'refreshToken is required'})
            return
        }
        const payload = verifyRefreshToken(refreshToken)
        await User.findByIdAndUpdate(payload.userId, {refreshToken: null})

        res.json({message: 'Logged out'})
    }catch(err){
        console.error(err)
        res.status(401).json({message: 'Invalid refresh token'})
    }
})

export default router