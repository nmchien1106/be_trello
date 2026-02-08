import { Status } from '@/types/response'
import { errorResponse } from '@/utils/response'
import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    handler: (req, res, next) => {
        next(errorResponse(Status.BAD_REQUEST, 'Too many requests from this IP, please try again after 15 minutes'))
    }
})
