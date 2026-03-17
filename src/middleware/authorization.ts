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
            console.log(membership)
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

            // 1. Owner always has access
            if (board.owner?.id === user.id) return next()

            // 2. Check Board Membership
            const boardMemberRepository = AppDataSource.getRepository(BoardMembers)
            const membership = await boardMemberRepository.findOne({
                where: {
                    board: { id: boardId },
                    user: { id: user.id }
                },
                relations: ['role', 'role.permissions']
            })

            if (membership) {
                const permissions = membership.role.permissions?.map((p) => p.name) ?? []
                const requiredPermissions = Array.isArray(requiredPermission)
                    ? requiredPermission
                    : [requiredPermission]
                if (requiredPermissions.every((p) => permissions.includes(p))) {
                    return next()
                }
            }

            // 3. Check Workspace Membership (if board is in a workspace and user is ws admin or has ws perms)
            if (board.workspace?.id) {
                const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMembers)
                const wsMembership = await workspaceMemberRepository.findOne({
                    where: {
                        workspace: { id: board.workspace.id },
                        user: { id: user.id }
                    },
                    relations: ['role', 'role.permissions']
                })

                if (wsMembership) {
                    // Workspace admins can do everything with boards in their workspace
                    if (wsMembership.role.name === 'workspace_admin') return next()

                    // Or if they have the specific workspace permission (though usually we map ws perms to board perms)
                    // For now, let's assume ws admin or direct board member.
                    // To be safer, if it's a READ permission, we can allow it if they are ws members and board is workspace-level.
                    const isReadRequest = Array.isArray(requiredPermission)
                        ? requiredPermission.every((p) => p.includes(':read'))
                        : (requiredPermission as string).includes(':read')

                    if (isReadRequest && board.permissionLevel !== 'private') return next()
                }
            }

            // 4. Public access
            const isReadRequest = Array.isArray(requiredPermission)
                ? requiredPermission.every((p) => p.includes(':read'))
                : (requiredPermission as string).includes(':read')

            if (isReadRequest && board.permissionLevel === 'public') return next()

            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        } catch (err) {
            console.log(err)
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

            const board = list.board
            if (board.owner?.id === user.id) return next()

            const boardMemberRepository = AppDataSource.getRepository(BoardMembers)
            const membership = await boardMemberRepository.findOne({
                where: {
                    board: { id: board.id },
                    user: { id: user.id }
                },
                relations: ['role', 'role.permissions']
            })

            if (membership) {
                const permissions = membership.role.permissions?.map((p) => p.name) ?? []
                const requiredPermissions = Array.isArray(requiredPermission)
                    ? requiredPermission
                    : [requiredPermission]
                if (requiredPermissions.every((p) => permissions.includes(p))) {
                    return next()
                }
            }

            if (board.workspace?.id) {
                const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMembers)
                const wsMembership = await workspaceMemberRepository.findOne({
                    where: {
                        workspace: { id: board.workspace.id },
                        user: { id: user.id }
                    },
                    relations: ['role']
                })
                if (wsMembership && wsMembership.role.name === 'workspace_admin') return next()
            }

            const isReadRequest = Array.isArray(requiredPermission)
                ? requiredPermission.every((p) => p.includes(':read'))
                : (requiredPermission as string).includes(':read')

            if (isReadRequest && board.permissionLevel === 'public') return next()

            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        } catch (err) {
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

            // 1. Owner always has access
            if (board.owner?.id === user.id) return next()

            // 2. Check Board Membership
            const boardMemberRepository = AppDataSource.getRepository(BoardMembers)
            const membership = await boardMemberRepository.findOne({
                where: {
                    board: { id: board.id },
                    user: { id: user.id }
                },
                relations: ['role', 'role.permissions']
            })

            if (!membership) {
                return next(errorResponse(Status.NOT_FOUND, 'You are not a member of this board'))
            }

            const role = membership.role
            if (!role) {
                return next(errorResponse(Status.NOT_FOUND, 'Role not found'))
            }

            const permissions = role.permissions?.map((p) => p.name) ?? []
            const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
            const hasPermission = requiredPermissions.some((p) => permissions.includes(p))

            if (membership) {
                const permissions = membership.role.permissions?.map((p) => p.name) ?? []
                const requiredPermissions = Array.isArray(requiredPermission)
                    ? requiredPermission
                    : [requiredPermission]
                // For cards, we usually check board-level permissions like UPDATE_BOARD or specific card perms if they exist
                // However, the original code used some(p) which is more permissive. Let's keep it robust.
                if (requiredPermissions.some((p) => permissions.includes(p))) {
                    return next()
                }
            }

            // 3. Workspace Membership
            if (board.workspace?.id) {
                const workspaceMemberRepository = AppDataSource.getRepository(WorkspaceMembers)
                const wsMembership = await workspaceMemberRepository.findOne({
                    where: {
                        workspace: { id: board.workspace.id },
                        user: { id: user.id }
                    },
                    relations: ['role']
                })
                if (wsMembership && wsMembership.role.name === 'workspace_admin') return next()
            }

            // 4. Public Access
            const isReadRequest = Array.isArray(requiredPermission)
                ? requiredPermission.every((p) => p.includes(':read'))
                : (requiredPermission as string).includes(':read')

            if (isReadRequest && board.permissionLevel === 'public') return next()

            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        } catch (err) {
            console.error('AuthorizeCardPermission Error:', err)
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizeAttachmentPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            const attachmentId = req.params.id || req.body.attachmentId

            const attachmentRepo = AppDataSource.getRepository(Attachment)
            const attachment = await attachmentRepo.findOne({
                where: { id: attachmentId },
                relations: ['card', 'card.list', 'card.list.board']
            })

            if (!attachment) {
                return next(errorResponse(Status.NOT_FOUND, 'Attachment not found'))
            }

            const boardId = attachment.card.list.board.id

            const boardMemberRepo = AppDataSource.getRepository(BoardMembers)
            const membership = await boardMemberRepo.findOne({
                where: {
                    board: { id: boardId },
                    user: { id: user?.id }
                },
                relations: ['role', 'role.permissions']
            })

            if (!membership) {
                return next(errorResponse(Status.NOT_FOUND, 'You are not a member of this board'))
            }

            const role = membership.role
            if (!role) {
                return next(errorResponse(Status.NOT_FOUND, 'Role not found'))
            }

            const permissions = role.permissions?.map((p) => p.name) ?? []
            const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
            const hasPermission = requiredPermissions.every((p) => permissions.includes(p))

            if (!hasPermission) {
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

            const boardMemberRepo = AppDataSource.getRepository(BoardMembers)

            const membership = await boardMemberRepo.findOne({
                where: {
                    board: { id: boardId },
                    user: { id: user.id }
                },
                relations: ['role', 'role.permissions']
            })

            if (!membership) {
                return next(errorResponse(Status.FORBIDDEN, 'You are not a member of this board'))
            }

            const permissions = membership.role.permissions?.map((p) => p.name) ?? []
            const requiredPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]

            const hasPermission = requiredPermissions.every((p) => permissions.includes(p))

            if (!hasPermission) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}
