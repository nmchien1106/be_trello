import { IActivityRepository } from './activity.repository'
import { Status } from '@/types/response'
import { Activity } from '@/entities/activity.entity'

export class ActivityService {
    constructor(private repo: IActivityRepository) {}

    async getByBoard(boardId: string, page = 1, size = 20) {
        const offset = (page - 1) * size
        const activities: Activity[] = await this.repo.findByBoard(boardId, size, offset)
        return {
            status: Status.OK,
            message: 'Activities retrieved successfully',
            data: activities
        }
    }

    async getByCard(cardId: string, page = 1, size = 20) {
        const offset = (page - 1) * size
        const activities: Activity[] = await this.repo.findByCard(cardId, size, offset)
        return {
            status: Status.OK,
            message: 'Activities retrieved successfully',
            data: activities
        }
    }

    async getByUser(userId: string, page = 1, size = 20) {
        const offset = (page - 1) * size
        const activities: Activity[] = await this.repo.findByUser(userId, size, offset)
        return {
            status: Status.OK,
            message: 'Activities retrieved successfully',
            data: activities
        }
    }

    async getByComment(commentId: string, page = 1, size = 20) {
        const offset = (page - 1) * size
        const activities: Activity[] = await this.repo.findByComment(commentId, size, offset)
        return {
            status: Status.OK,
            message: 'Activities retrieved successfully',
            data: activities
        }
    }

    async getActivity(id: string) {
        const activity = await this.repo.findById(id)
        if (!activity) {
            return {
                status: Status.NOT_FOUND,
                message: 'Activity not found'
            }
        }
        return {
            status: Status.OK,
            message: 'Activity fetched',
            data: activity
        }
    }

    async deleteActivity(id: string) {
        const deleted = await this.repo.deleteActivity(id)
        if (!deleted) {
            return {
                status: Status.NOT_FOUND,
                message: 'Activity not found'
            }
        }
        return {
            status: Status.OK,
            message: 'Activity deleted'
        }
    }
}
