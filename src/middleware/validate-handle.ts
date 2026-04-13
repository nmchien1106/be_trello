import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodSchema } from 'zod'
import { errorResponse } from '../utils/response'
import { Status } from '@/types/response'

export const validateHandle = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        let parseResult

        if (req.method === 'GET') {
            parseResult = schema.safeParse({
                params: req.params,
                query: req.query
            })
        } else {
            parseResult = schema.safeParse(req.body)
        }

        if (!parseResult.success) {
            throw parseResult.error
        }

        if (req.method === 'GET') {
            Object.assign(req.params, parseResult.data.params)
            Object.assign(req.query, parseResult.data.query)
        } else {
            Object.assign(req.body, parseResult.data)
        }

        next()
    } catch (err) {
        if (err instanceof ZodError) {
            console.error('Validation failed for:', req.method, req.url)
            console.error('Input data:', req.method === 'GET' ? req.query : req.body)
            console.error('Zod Error Issues:', JSON.stringify(err.issues, null, 2))

            const error: Record<string, string> = {}

            err.issues.forEach((issue) => {
                const field = issue.path.join('.') || 'body'
                if (!error[field]) {
                    error[field] = issue.message
                }
            })

            return res.status(Status.BAD_REQUEST).json(
                errorResponse(
                    Status.BAD_REQUEST,
                    'Validate error: One or more fields are invalid',
                    error,
                    'VALIDATE_ERROR'
                )
            )
        }

        next(err)
    }
}