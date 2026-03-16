import { AuthRequest } from '@/types/auth-request'
import { Status } from '@/types/response'
import { errorResponse } from '@/utils/response'
import { NextFunction, Request, Response } from 'express'
import notificationService from './notification.service'
import { notificationSSEService } from './SSE/notification-sse.service'

export class NotificationController {
    /**
     * GET /api/notifications
     * Get user notifications
     */
    getUserNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id
            const { limit, offset, unreadOnly } = req.query

            const result = await notificationService.getUserNotifications(userId!, {
                limit: Number(limit),
                offset: Number(offset),
                unreadOnly: unreadOnly === 'true'
            })

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'User notifications fetched successfully',
                data: result
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get user notifications', err))
        }
    }

    /**
     * PATCH /api/notifications/:id/read
     * Mark a notification as read
     */
    markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params

            const result = await notificationService.markAsRead(id)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Notification marked as read successfully',
                data: result
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to mark notification as read', err))
        }
    }

    /**
     * PATCH /api/notifications/read-all
     * Mark all notifications as read
     */
    markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id

            const result = await notificationService.markAllAsRead(userId!)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'All notifications marked as read successfully',
                data: result
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to mark all notifications as read', err))
        }
    }

    /**
     * DELETE /api/notifications/:id
     * Delete a notification
     */
    deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params

            const result = await notificationService.delete(id)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Notification deleted successfully',
                data: result
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to delete notification', err))
        }
    }

    /**
     * Get /api/notification/unread-count
     * Get unread notification count
     */
    getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id

            const result = await notificationService.getUnreadCount(userId!)

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Unread notification count fetched successfully',
                data: result
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get unread notification count', err))
        }
    }

    /**
     *  GET api/notifications/stream
     *  SSE endpoint
     */
    streamNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id

            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')

            res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`)

            notificationSSEService.addConnection(userId!, res)
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to stream notifications', err))
        }
    }
}

export default new NotificationController()
