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

const normalizePermissions = (requiredPermission: string | string[]) =>
    Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]

const hasAllPermissions = (granted: string[], requiredPermission: string | string[]) => {
    const required = normalizePermissions(requiredPermission)
    return required.every((perm) => granted.includes(perm))
}

const rolePermissionCache = new Map<string, string[]>()

const getRolePermissions = async (roleName: string) => {
    if (rolePermissionCache.has(roleName)) {
        return rolePermissionCache.get(roleName)!
    }

    const role = await AppDataSource.getRepository(Role).findOne({
        where: { name: roleName },
        relations: ['permissions']
    })

    const permissions = role?.permissions?.map((permission) => permission.name) ?? []
    rolePermissionCache.set(roleName, permissions)
    return permissions
}

const canAccessBoardByMembership = async (params: {
    userId: string
    board: Board
    requiredPermission: string | string[]
}) => {
    const { userId, board, requiredPermission } = params

    if (board.owner?.id === userId) return true

    const boardMemberRepository = AppDataSource.getRepository(BoardMembers)
    const boardMembership = await boardMemberRepository.findOne({
        where: {
            board: { id: board.id },
            user: { id: userId }
        },
        relations: ['role', 'role.permissions']
    })

    if (boardMembership?.role) {
        const boardPermissions = boardMembership.role.permissions?.map((p) => p.name) ?? []
        if (hasAllPermissions(boardPermissions, requiredPermission)) {
            return true
        }
    }

    if (!board.workspace?.id) return false

    const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMembers)
    const wsMembership = await workspaceMemberRepository.findOne({
        where: {
            workspace: { id: board.workspace.id },
            user: { id: userId }
        },
        relations: ['role']
    })

    if (!wsMembership) return false

    const effectiveBoardRole = wsMembership.role?.name === 'workspace_admin' ? 'board_admin' : 'board_member'
    const effectivePermissions = await getRolePermissions(effectiveBoardRole)

    return hasAllPermissions(effectivePermissions, requiredPermission)
}

export const authorizePermissionWorkspace = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }

            const workspaceId = req.params.workspaceId || req.body.workspaceId
            const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMembers)

            const membership = await workspaceMemberRepository.findOne({
                where: {
                    workspace: { id: workspaceId },
                    user: { id: user.id }
                },
                relations: ['role', 'role.permissions']
            })
            if (!membership) {
                return next(errorResponse(Status.NOT_FOUND, 'Membership not found'))
            }
            const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
            const hasPermission = permissions.every((perm) => membership.role.permissions.some((p) => p.name === perm))

            if (!hasPermission) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            console.log(err)
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeRole = (requiredRoles: string | string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }

            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
            const hasRole = roles.every((role) => user.roles.includes(role))
            if (!hasRole) {
                return next(errorResponse(Status.FORBIDDEN, 'Role access denied'))
            }
            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Role access denied'))
        }
    }
}

export const authorizeRoleWorkspace = (requiredRoles: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const workspaceId = req.params.workspaceId || req.body.workspaceId
            const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMembers)
            const membership = await workspaceMemberRepository.findOne({
                where: {
                    workspace: { id: workspaceId },
                    user: { id: user.id }
                },
                relations: ['role']
            })
            if (!membership) {
                return next(errorResponse(Status.NOT_FOUND, 'Membership not found'))
            }
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
            const hasRole = roles.every((role) => membership.role.name === role)
            if (!hasRole) {
                return next(errorResponse(Status.FORBIDDEN, 'Role access denied'))
            }
            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Role access denied'))
        }
    }
}

export const authorizeBoardPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const boardId = req.params.boardId || req.body.boardId || req.query.boardId || req.params.id

            const boardRepo = AppDataSource.getRepository(Board)
            const board = await boardRepo.findOne({
                where: { id: boardId },
                relations: ['workspace', 'owner']
            })

            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board,
                requiredPermission
            })

            if (allowed) return next()

            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeListPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) return next(errorResponse(Status.NOT_FOUND, 'User not found'))

            const listId = req.params.listId || req.body.listId || req.query.listId || req.params.id

            const listRepository = AppDataSource.getRepository(List)
            const list = await listRepository.findOne({
                where: { id: listId },
                relations: ['board', 'board.workspace', 'board.owner']
            })

            if (!list) {
                return next(errorResponse(Status.NOT_FOUND, 'List not found'))
            }

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board: list.board,
                requiredPermission
            })

            if (allowed) return next()

            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        } catch (err) {
            console.log(err)
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeCardPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) return next(errorResponse(Status.NOT_FOUND, 'User not found'))

            const cardId = req.params.id || req.params.cardId || req.body.cardId || req.query.cardId
            if (!cardId) {
                return next(errorResponse(Status.BAD_REQUEST, 'Card id is required'))
            }

            const cardRepository = AppDataSource.getRepository(Card)
            const card = await cardRepository.findOne({
                where: { id: cardId },
                relations: ['list', 'list.board', 'list.board.workspace', 'list.board.owner']
            })
            if (!card) {
                return next(errorResponse(Status.NOT_FOUND, 'Card not found'))
            }

            const board = card.list.board

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board,
                requiredPermission
            })

            if (allowed) return next()

            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        } catch (err) {
            console.error('AuthorizeCardPermission Error:', err)
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeChecklistPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) return next(errorResponse(Status.NOT_FOUND, 'User not found'))

            const checklistId = req.params.id || req.body.checklistId
            if (!checklistId) {
                return next(errorResponse(Status.BAD_REQUEST, 'Checklist id is required'))
            }

            const checklistRepo = AppDataSource.getRepository(Checklist)
            const checklist = await checklistRepo.findOne({
                where: { id: checklistId },
                relations: [
                    'card',
                    'card.list',
                    'card.list.board',
                    'card.list.board.workspace',
                    'card.list.board.owner'
                ]
            })

            if (!checklist) {
                return next(errorResponse(Status.NOT_FOUND, 'Checklist not found'))
            }

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board: checklist.card.list.board,
                requiredPermission
            })

            if (!allowed) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeChecklistItemPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) return next(errorResponse(Status.NOT_FOUND, 'User not found'))

            const itemId = req.params.itemId
            if (!itemId) {
                return next(errorResponse(Status.BAD_REQUEST, 'Checklist item id is required'))
            }

            const checklistItemRepo = AppDataSource.getRepository(ChecklistItem)
            const item = await checklistItemRepo.findOne({
                where: { id: itemId },
                relations: [
                    'checklist',
                    'checklist.card',
                    'checklist.card.list',
                    'checklist.card.list.board',
                    'checklist.card.list.board.workspace',
                    'checklist.card.list.board.owner'
                ]
            })

            if (!item) {
                return next(errorResponse(Status.NOT_FOUND, 'Checklist item not found'))
            }

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board: item.checklist.card.list.board,
                requiredPermission
            })

            if (!allowed) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeAttachmentPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const attachmentId = req.params.id || req.body.attachmentId

            const attachmentRepo = AppDataSource.getRepository(Attachment)
            const attachment = await attachmentRepo.findOne({
                where: { id: attachmentId },
                relations: ['card', 'card.list', 'card.list.board']
            })

            if (!attachment) {
                return next(errorResponse(Status.NOT_FOUND, 'Attachment not found'))
            }

            const boardRepo = AppDataSource.getRepository(Board)
            const board = await boardRepo.findOne({
                where: { id: attachment.card.list.board.id },
                relations: ['workspace', 'owner']
            })

            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board,
                requiredPermission
            })

            if (!allowed) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const checkBoardMember = async (requiredRoles: string | string[], boardId: string, userId: string) => {
    const BoardMemberRepository = AppDataSource.getRepository(BoardMembers)

    return BoardMemberRepository.findOne({
        where: {
            board: { id: boardId },
            user: { id: userId }
        },
        relations: ['role']
    })
        .then((membership) => {
            if (!membership) {
                return false
            }
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

            const hasRole = roles.some((role) => {
                return membership.role.name === role
            })
            return hasRole
        })
        .catch(() => {
            return false
        })
}

export const authorizeLabelPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }

            const labelId = req.params.id || req.body.labelId || req.query.labelId || req.params.labelId

            if (!labelId) {
                return next(errorResponse(Status.BAD_REQUEST, 'Label id is required'))
            }

            const labelRepo = AppDataSource.getRepository(Label)

            const label = await labelRepo.findOne({
                where: { id: labelId },
                relations: ['board']
            })

            if (!label) {
                return next(errorResponse(Status.NOT_FOUND, 'Label not found'))
            }

            const boardId = label.board.id

            const boardRepo = AppDataSource.getRepository(Board)
            const board = await boardRepo.findOne({
                where: { id: boardId },
                relations: ['workspace', 'owner']
            })

            if (!board) {
                return next(errorResponse(Status.NOT_FOUND, 'Board not found'))
            }

            const allowed = await canAccessBoardByMembership({
                userId: user.id,
                board,
                requiredPermission
            })

            if (!allowed) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}
