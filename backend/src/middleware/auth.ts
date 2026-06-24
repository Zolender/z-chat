import {Response, NextFunction} from 'express'
import { AuthenticatedRequest } from '../types'
import { verifyAccessToken } from '../lib/jwt'

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction){
    const authHeader= req.headers.authorization
    if(!authHeader?.startsWith("Bearer ")){
        res.status(401).json({message: 'No token provided'})
        return
    }

    const token = authHeader.split(" ")[1]
    try{
        req.user = verifyAccessToken(token)
        next()
    } catch{
        res.status(401).json({message: "Invalid or expired token"})
    }
}