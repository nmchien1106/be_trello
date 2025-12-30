import { NextFunction, Response } from 'express'
import { AuthRequest } from '@/types/auth-request'
import { successResponse, errorResponse } from '@/utils/response'
import { Status } from '@/types/response'
import checklistService from './checklist.service'

class ChecklistController {
    createChecklist = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await checklistService.createChecklist(req.user.id, req.body)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message))
        }
    }

    getChecklistsOnCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const { cardId } = req.params
            const result = await checklistService.getChecklistsOnCard(req.user.id, cardId)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }

    updateChecklist = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const { id } = req.params
            const result = await checklistService.updateChecklist(req.user.id, id, req.body.title)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }

    deleteChecklist = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const { id } = req.params
            const result = await checklistService.deleteChecklist(req.user.id, id)
            return res.status(result.status).json(successResponse(result.status, result.message))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }

    createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await checklistService.createItem(req.user.id, req.body)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message))
        }
    }

    updateItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const { id } = req.params
            const result = await checklistService.updateItem(req.user.id, id, req.body)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }
    
    deleteItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const { id } = req.params
            const result = await checklistService.deleteItem(req.user.id, id)
            return res.status(result.status).json(successResponse(result.status, result.message))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }
}

export default new ChecklistController()