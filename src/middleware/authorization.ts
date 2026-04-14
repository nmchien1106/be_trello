import { NextFunction, Request, RequestHandler, Response } from 'express'
import AppDataSource from '@/config/typeorm.config'
import { WorkspaceMembers } from '@/entities/workspace-member.entity'
import { errorResponse } from '@/utils/response'
import { Status } from '@/types/response'
import { AuthenticatedRequest, AuthRequest } from '@/types/auth-request'
import { BoardMembers } from '@/entities/board-member.entity'
import { Board } from '@/entities/board.entity'
import { Card } from '@/entities/card.entity'
import { List } from '@/entities/list.entity'
import { Attachment } from '@/entities/attachment.entity'
import { Label } from '@/entities/label.entity'
import { Role } from '@/entities/role.entity'
import { Checklist } from '@/entities/checklist.entity'
import { ChecklistItem } from '@/entities/checklist-item.entity'
import { Comment } from '@/entities/comment.entity'
import { Activity } from '@/entities/activity.entity'
import redisClient from '@/config/redis.config'

import listRepository from '@/apis/list/list.repository'
import cardRepository from '@/apis/card/card.repository'
import checklistRepository from '@/apis/checklist/checklist.repository'
import { canUserAccess } from '@/utils/authorizeHelper'
import { Permission } from '@/enums/permissions.enum'

type PermissionContext = { workspaceId?: string; boardId?: string } | null
type ContextResolver = (req: AuthRequest) => Promise<PermissionContext> | PermissionContext

const Resolvers = {
    fromWorkspaceId: (req: AuthRequest): PermissionContext => {
        const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId
        return workspaceId ? { workspaceId } : null
    },

    fromBoardId: (req: AuthRequest): PermissionContext => {
        const boardId = req.params.boardId || req.body.boardId || req.query.boardId || req.params.id
        return boardId ? { boardId } : null
    },

    fromListId: async (req: AuthRequest): Promise<PermissionContext> => {
        const listId = req.params.listId || req.body.listId || req.query.listId || req.params.id
        if (!listId) return null

        const list = await listRepository.findById(listId)
        return list ? { boardId: list.board.id } : null
    },

    fromCardId: async (req: AuthRequest): Promise<PermissionContext> => {
        const cardId = req.params.cardId || req.body.cardId || req.query.cardId || req.params.id
        if (!cardId) return null
        const card = await cardRepository.findById(cardId)
        return card ? { boardId: card.list.board.id } : null
    },

    fromChecklistId: async (req: AuthRequest): Promise<PermissionContext> => {
        const checklistId = req.params.checklistId || req.body.checklistId || req.query.checklistId || req.params.id
        if (!checklistId) return null
        const checklist = await checklistRepository.findChecklistById(checklistId)
        return checklist ? { boardId: checklist.card.list.board.id } : null
    },

    fromChecklistItemId: async (req: AuthRequest): Promise<PermissionContext> => {
        const itemId = req.params.itemId
        if (!itemId) return null

        const itemRepo = AppDataSource.getRepository(ChecklistItem)
        const item = await itemRepo.findOne({
            where: { id: itemId },
            relations: ['checklist', 'checklist.card', 'checklist.card.list', 'checklist.card.list.board']
        })

        return item ? { boardId: item.checklist.card.list.board.id } : null
    },

    fromCommentId: async (req: AuthRequest): Promise<PermissionContext> => {
        const commentId = req.params.commentId || req.body.commentId || req.params.id
        if (!commentId) return null

        const commentRepo = AppDataSource.getRepository(Comment)
        const comment = await commentRepo.findOne({
            where: { id: commentId },
            relations: ['card', 'card.list', 'card.list.board']
        })

        return comment ? { boardId: comment.card.list.board.id } : null
    },

    fromAttachmentId: async (req: AuthRequest): Promise<PermissionContext> => {
        const attachmentId = req.params.id || req.body.attachmentId || req.query.attachmentId
        if (!attachmentId) return null

        const attachmentRepo = AppDataSource.getRepository(Attachment)
        const attachment = await attachmentRepo.findOne({
            where: { id: attachmentId },
            relations: ['card', 'card.list', 'card.list.board']
        })

        return attachment ? { boardId: attachment.card.list.board.id } : null
    },

    fromLabelId: async (req: AuthRequest): Promise<PermissionContext> => {
        const labelId = req.params.id || req.body.labelId || req.query.labelId || req.params.labelId
        if (!labelId) return null

        const labelRepo = AppDataSource.getRepository(Label)
        const label = await labelRepo.findOne({
            where: { id: labelId },
            relations: ['board']
        })

        return label ? { boardId: label.board.id } : null
    },

    fromWorkspaceShareLinkToken: async (req: AuthRequest): Promise<PermissionContext> => {
        const token = (req.query?.token as string | undefined) || req.body?.token
        if (!token) return null

        const dataStr = await redisClient.get(`workspaceShareLink:${token}`)
        if (!dataStr) return null

        const parsed = JSON.parse(dataStr) as { workspaceId?: string }
        return parsed.workspaceId ? { workspaceId: parsed.workspaceId } : null
    }
}

export const authorize = (requiredPermission: string, resolver: ContextResolver) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const context = await resolver(req)
            if (!context) {
                return next(errorResponse(Status.BAD_REQUEST, 'Invalid request context'))
            }
            const { workspaceId, boardId } = context
            let hasPermission: boolean = false
            if (boardId) hasPermission = await canUserAccess(user.id, requiredPermission, { boardId })
            if (workspaceId) hasPermission = await canUserAccess(user.id, requiredPermission, { workspaceId })

            if (!hasPermission) {
                return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to access this resource'))
            }
            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to access this resource'))
        }
    }
}

export const checkWorkspacePermission = (p: Permission) => authorize(p, Resolvers.fromWorkspaceId)
export const checkBoardPermission = (p: Permission) => authorize(p, Resolvers.fromBoardId)
export const checkListPermission = (p: Permission) => authorize(p, Resolvers.fromListId)
export const checkCardPermission = (p: Permission) => authorize(p, Resolvers.fromCardId)
export const checkChecklistPermission = (p: Permission) => authorize(p, Resolvers.fromChecklistId)
export const checkChecklistItemPermission = (p: Permission) => authorize(p, Resolvers.fromChecklistItemId)
export const checkCommentPermission = (p: Permission) => authorize(p, Resolvers.fromCommentId)
export const checkAttachmentPermission = (p: Permission) => authorize(p, Resolvers.fromAttachmentId)
export const checkLabelPermission = (p: Permission) => authorize(p, Resolvers.fromLabelId)
export const checkWorkspaceShareLinkPermission = (p: Permission) => authorize(p, Resolvers.fromWorkspaceShareLinkToken)

export const checkActivityPermission = (p: Permission) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }

            const activityId = req.params.id
            if (!activityId) {
                return next(errorResponse(Status.BAD_REQUEST, 'Invalid request context'))
            }

            const activityRepo = AppDataSource.getRepository(Activity)
            const activity = await activityRepo.findOne({
                where: { id: activityId },
                relations: ['board', 'card', 'actor']
            })

            if (!activity) {
                return next(errorResponse(Status.NOT_FOUND, 'Activity not found'))
            }

            if (!activity.boardId && !activity.cardId) {
                if (activity.actorId === user.id) return next()
                return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to access this resource'))
            }

            let boardId: string | null = null

            if (activity.cardId) {
                const card = await AppDataSource.getRepository(Card).findOne({
                    where: { id: activity.cardId },
                    relations: ['list', 'list.board']
                })
                boardId = card?.list?.board?.id ?? null
            } else if (activity.boardId) {
                boardId = activity.boardId
            }

            if (!boardId) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            const hasPermission = await canUserAccess(user.id, p, { boardId })
            if (!hasPermission) {
                return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to access this resource'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'You do not have permission to access this resource'))
        }
    }
}
