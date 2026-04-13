import { Router } from 'express'
import commentController from './comment.controller'
import { verifyAccessToken } from '@/utils/jwt'
import { validateHandle } from '@/middleware/validate-handle'
import { CommentSchema, UpdateCommentSchema } from './comment.schema'
import { checkCardPermission, checkCommentPermission } from '@/middleware/authorization'
import { PERMISSIONS } from '@/enums/permissions.enum'

const router = Router()

// Create a new comment
router.post(
    '/',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(CommentSchema),
    commentController.createComment
)

// Get comments on a specific card
router.get(
    '/card/:cardId',
    verifyAccessToken,
    checkCardPermission(PERMISSIONS.READ_CARD),
    commentController.getCommentsOnCard
)

// Delete a comment
router.delete(
    '/:commentId',
    verifyAccessToken,
    checkCommentPermission(PERMISSIONS.UPDATE_CARD),
    commentController.deleteComment
)

// Update a comment
router.put(
    '/:commentId',
    verifyAccessToken,
    checkCommentPermission(PERMISSIONS.UPDATE_CARD),
    validateHandle(UpdateCommentSchema),
    commentController.updateComment
)

// Get a comment by ID
router.get(
    '/:commentId',
    verifyAccessToken,
    checkCommentPermission(PERMISSIONS.READ_CARD),
    commentController.getCommentById
)

export default router
