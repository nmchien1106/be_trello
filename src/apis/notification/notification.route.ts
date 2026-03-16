import { Router } from "express";
import { verifyAccessToken, verifyAccessTokenSSE } from "@/utils/jwt";
import notificationController from "./notification.controller";

const router = Router()

router.get('/', verifyAccessToken, notificationController.getUserNotification)
router.patch('/:id/read', verifyAccessToken, notificationController.markAsRead)
router.patch('/read-all', verifyAccessToken, notificationController.markAllAsRead)
router.delete('/:id', verifyAccessToken, notificationController.deleteNotification)
router.get('/unread-count', verifyAccessToken, notificationController.getUnreadCount)
router.get('/stream', verifyAccessTokenSSE, notificationController.streamNotifications)

export default router