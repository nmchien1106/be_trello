import { Request, Response, NextFunction } from 'express'
import { ActivityService } from './activity.service'
import { ActivityRepository } from './activity.repository'
import AppDataSource from '@/config/typeorm.config'
import { Activity } from '@/entities/activity.entity'
import { errorResponse, successResponse } from '@/utils/response'
import { Status } from '@/types/response'

const activityRepo = new ActivityRepository(AppDataSource.getRepository(Activity))
const activityService = new ActivityService(activityRepo)

class ActivityController {
    async getActivitiesByBoard(req: Request, res: Response, next: NextFunction) {
        try {
            const { boardId } = req.params
            const page = parseInt(req.query.page as string) || 1
            const size = parseInt(req.query.size as string) || 20

            const result = await activityService.getByBoard(boardId, page, size)
            return res.status(result.status).json(result)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to fetch activities', err))
        }
    }

    async getActivitiesByCard(req: Request, res: Response, next: NextFunction) {
        try {
            const { cardId } = req.params
            const page = parseInt(req.query.page as string) || 1
            const size = parseInt(req.query.size as string) || 20

            const result = await activityService.getByCard(cardId, page, size)
            return res.status(result.status).json(result)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to fetch activities', err))
        }
    }

    async getActivitiesByUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id
            const page = parseInt(req.query.page as string) || 1
            const size = parseInt(req.query.size as string) || 20

            const result = await activityService.getByUser(userId, page, size)
            return res.status(result.status).json(result)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to fetch activities', err))
        }
    }

    async getActivitiesByComment(req: Request, res: Response, next: NextFunction) {
        try {
            const { commentId } = req.params
            const page = parseInt(req.query.page as string) || 1
            const size = parseInt(req.query.size as string) || 20

            const result = await activityService.getByComment(commentId, page, size)
            return res.status(result.status).json(result)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to fetch activities', err))
        }
    }

    async getActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const result = await activityService.getActivity(id)
            return res.status(result.status).json(result)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to fetch activity', err))
        }
    }

    async deleteActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const result = await activityService.deleteActivity(id)
            return res.status(result.status).json(result)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to delete activity', err))
        }
    }
}

export default new ActivityController()
