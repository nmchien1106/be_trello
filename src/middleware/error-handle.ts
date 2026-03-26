import { NextFunction, Request, Response } from 'express'
import { ApiErrorResponse } from '@/types/response'
import { errorResponse } from '@/utils/response'

export const ErrorHandler = (err: ApiErrorResponse, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500

    return res.status(status).json({
        status,
        message: err.message || 'Internal Server Error',
        error: err.error,
        error_code: err.error_code
    })
}
