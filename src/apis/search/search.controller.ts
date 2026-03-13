import { NextFunction, Response } from 'express'
import { AuthRequest } from '@/types/auth-request'
import { successResponse, errorResponse } from '@/utils/response'
import searchService from './search.service'
import { Status } from '@/types/response'

class SearchController {
    globalSearch = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const keyword = req.query.keyword as string
            const result = await searchService.globalSearch(req.user.id, keyword)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Global search successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }
}

export default new SearchController()
