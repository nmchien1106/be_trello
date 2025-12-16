import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodSchema } from 'zod'
import { errorResponse } from '../utils/response'
import { Status } from '@/types/response'

export const validateHandle = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const parseResult = req.method === 'GET' ? schema.safeParse(req.query) : schema.safeParse(req.body)

        if (!parseResult.success) {
            throw parseResult.error
        }

        if (req.method !== 'GET') {
            req.body = parseResult.data
        }

        next()
    } catch (err) {
        if (err instanceof ZodError) {
            const error: Record<string, string> = {}

            err.issues.forEach((issue) => {
                const field = issue.path.join('.') || 'body'
                if (!error[field]) {
                    error[field] = issue.message
                }
            })


            return res.status(Status.BAD_REQUEST).json(errorResponse(Status.BAD_REQUEST, 'Validate error: One or more fields are invalid', error))
        }

        next(err)
    }
}
