import jwt from 'jsonwebtoken'
import type{ JwtPayload, RefreshPayload} from '../types'


export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {expiresIn: '15m'})
}

export function signRefreshToken(payload: RefreshPayload): string {
    return jwt.sign(payload, process.env.REFRESH_SECRET!, {expiresIn: '7d'})
}

export function verifyAccessToken(token: string): JwtPayload{
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload
}

export function verifyRefreshToken(token: string): RefreshPayload{
    return jwt.verify(token, process.env.REFRESH_SECRET!) as RefreshPayload
}