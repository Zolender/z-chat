import {Request} from 'express'

export interface JwtPayload{
    userId: string
    username: string
    email: string
}

export interface RefreshPayload{
    userId: string
}

export interface AuthenticatedRequest extends Request{
    user?: JwtPayload
}