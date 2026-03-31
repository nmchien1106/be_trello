import { NextFunction, Request, Response } from 'express'
import { ApiErrorResponse } from '@/types/response'
import { QueryFailedError } from 'typeorm'

export const ErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Bắt lỗi DB từ TypeORM và chuyển thành message thân thiện
    if (err instanceof QueryFailedError) {
        const dbMessage = (err as any).message || ''
        let friendlyMessage = 'Database error. Please try again.'

        if (dbMessage.includes('value too long') || dbMessage.includes('character varying')) {
            friendlyMessage = 'One or more fields exceed the maximum allowed length.'
        } else if (dbMessage.includes('duplicate key') || dbMessage.includes('unique constraint')) {
            friendlyMessage = 'This record already exists.'
        } else if (dbMessage.includes('violates not-null') || dbMessage.includes('null value')) {
            friendlyMessage = 'A required field is missing.'
        } else if (dbMessage.includes('foreign key')) {
            friendlyMessage = 'Related record not found.'
        }

        return res.status(400).json({
            status: 400,
            message: friendlyMessage,
        })
    }

    const status = err.status || 500
    return res.status(status).json({
        status,
        message: err.message || 'An unexpected error occurred. Please try again.',
        error: err.error,
        error_code: err.error_code
    })
}
