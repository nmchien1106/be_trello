import { NextFunction, Request, Response } from 'express'
import { ApiErrorResponse } from '@/types/response'
import { errorResponse } from '@/utils/response'

export const ErrorHandler = (err: ApiErrorResponse, req: Request, res: Response, next: NextFunction) => {
    const errorMsg = err.message || 'Internal Server Erroro'
    return res.status(err.status || 500).json(errorResponse(err.status || 500, errorMsg))
}
