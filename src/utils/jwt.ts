import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from 'dotenv'
import redisClient from '@/config/redis.config'
import { AuthRequest } from '@/types/auth-request'
import { NextFunction, Response } from 'express'
import { errorResponse } from './response'
import { Status } from '@/types/response'
import ms, { StringValue } from 'ms'
import { Config } from '@/config/config'

config()

export const generateToken = async (user_id: string, type: 'access' | 'refresh' = 'access'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const payload = { id: user_id, jti: Date.now() + Math.random() }
        const secret = type === 'access' ? process.env.ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET
        const expiresIn = type === 'access' ? process.env.ACCESS_TOKEN_EXPIRES_IN : process.env.REFRESH_TOKEN_EXPIRES_IN

        if (!secret || !expiresIn) {
            return reject(new Error('Missing JWT secret or expiration'))
        }

        const options: SignOptions = { expiresIn }

        jwt.sign(payload, secret, options, async (err: Error, token: string) => {
            if (err) return reject(err)
            if (token) {
                await redisClient.set(`${user_id}-${type}`, token, { EX: Config.cookieMaxAge })
                return resolve(token)
            } else {
                return reject(new Error('Failed to generate token'))
            }
        })
    })
}

export const verifyAccessToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.headers['authorization']) {
            return next(errorResponse(Status.UNAUTHORIZED, 'Unauthorized!'))
        }
        const authHeader = req.headers['authorization']
        const token = authHeader.split(' ')[1]

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (error: any, payload: any) => {
            if (error) {
                if (error.name === 'TokenExpiredError') {
                    return next(errorResponse(Status.UNAUTHORIZED, 'Access Token Expired'))
                }

                return next(errorResponse(Status.UNAUTHORIZED, 'Invalid Access Token'))
            }

            req.user = payload as { id: string }
            const redisToken = await redisClient.get(`${req.user?.id}-access`)
            if (redisToken !== token) {
                return next(errorResponse(Status.UNAUTHORIZED, 'Invalid Access Token'))
            }
        })

        next()
    } catch (err) {
        next(errorResponse(Status.UNAUTHORIZED, 'Invalid access token'))
    }
}

export const verifyRefreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.refresh
        if (!token) return next(errorResponse(Status.UNAUTHORIZED, 'Unauthorized'))

        const payload: any = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!)
        req.user = payload

        const redisToken = await redisClient.get(`${req.user!.id}-refresh`)
        if (!redisToken || redisToken !== token) {
            return next(errorResponse(Status.UNAUTHORIZED, 'Invalid Refresh Token'))
        }

        return next()
    } catch (error: any) {
        return next(errorResponse(Status.UNAUTHORIZED, 'Invalid Refresh Token'))
    }
}

export const generateEmailToken = (userId: string): string => {
    const secret = process.env.VERIFY_SECRET!
    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1d' })
    return token
}
