import { Router } from 'express'
import activityController from './activity.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import {
    GetActivitiesByBoardSchema,
    GetActivitiesByCardSchema,
    GetActivitySchema,
    DeleteActivitySchema,
    GetActivitiesByUserSchema,
    GetActivitiesByCommentSchema
} from './activity.schema'
import {
    checkActivityPermission,
    checkBoardPermission,
    checkCardPermission,
    checkCommentPermission
} from '@/middleware/authorization'
import { PERMISSIONS } from '@/enums/permissions.enum'
const route = Router()

route.get(
    '/board/:boardId',
    verifyAccessToken,
    checkBoardPermission(PERMISSIONS.READ_BOARD),
    validateHandle(GetActivitiesByBoardSchema),
    activityController.getActivitiesByBoard
)

route.get(
    '/card/:cardId',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    validateHandle(GetActivitiesByCardSchema),
    activityController.getActivitiesByCard
)

route.get('/user', verifyAccessToken, validateHandle(GetActivitiesByUserSchema), activityController.getActivitiesByUser)

route.get(
    '/comment/:commentId',
    verifyAccessToken,
    checkCommentPermission(PERMISSIONS.READ_CARD),
    validateHandle(GetActivitiesByCommentSchema),
    activityController.getActivitiesByComment
)

route.get(
    '/:id',
    verifyAccessToken,
    checkActivityPermission(PERMISSIONS.READ_BOARD),
    validateHandle(GetActivitySchema),
    activityController.getActivity
)

route.delete(
    '/:id',
    verifyAccessToken,
    checkActivityPermission(PERMISSIONS.MANAGE_BOARD),
    validateHandle(DeleteActivitySchema),
    activityController.deleteActivity
)

export default route
