import { Role } from './../entities/role.entity'
import { Permission } from './../entities/permission.entity'
import { User } from '@/entities/user.entity'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import AppDataSource from '@/config/typeorm.config'
import { WorkspaceMembers } from '@/entities/workspace-member.entity'
import { errorResponse } from '@/utils/response'
import { Status } from '@/types/response'
import { AuthenticatedRequest, AuthRequest } from '@/types/auth-request'
import { BoardMembers } from '@/entities/board-member.entity'
import { Board } from '@/entities/board.entity'

export const loadUserPermission = async (userId: string) => {
    try {
        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOne({
            where: { id: userId },
            relations: ['role', 'role.permissions']
        })

        if (!user || !user.role) return null
        const roles = user.role.map((role) => role.name)
        const permissions = user.role.flatMap((role) =>
            role.permissions ? role.permissions.map((permission) => permission.name) : []
        )

        const uniquePermissions = [...new Set(permissions)]
        return {
            roles,
            uniquePermissions
        }
    } catch (err) {
        return null
    }
}

export const authorizePermission = (requiredPermissions: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const userPermissions = await loadUserPermission(user.id as string)
            if (!userPermissions) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }
            user.roles = userPermissions.roles
            user.permissions = userPermissions.uniquePermissions

            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
            const hasPermission = permissions.every((perm) => userPermissions?.uniquePermissions.includes(perm))

            if (!hasPermission) {
                return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            next()
        } catch (err) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
    }
}

export const authorizePermissionWorkspace = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }

            const workspaceId = req.params.id || req.body.workspaceId
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
            const workspaceId = req.params.id || req.body.workspaceId
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

export const loadUserRoleAndPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user
        if (!user) {
            return next(errorResponse(Status.NOT_FOUND, 'User not found'))
        }
        const userPermissions = await loadUserPermission(user.id as string)
        if (!userPermissions) {
            return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
        }
        user.roles = userPermissions.roles
        user.permissions = userPermissions.uniquePermissions
        next()
    } catch (err) {
        return next(errorResponse(Status.FORBIDDEN, 'Permission denied'))
    }
}

export const authorizeBoardPermission = (requiredPermission: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user
            if (!user) {
                return next(errorResponse(Status.NOT_FOUND, 'User not found'))
            }
            const boardId = req.params.id || req.body.boardId || req.query.boardId

            const boardMemberRepository = AppDataSource.getRepository(BoardMembers)
            const boardRepository = AppDataSource.getRepository(Board)

            const board = await boardRepository.findOne({
                where: { id: boardId }
            })

            const membership = await boardMemberRepository.findOne({
                where: {
                    board: { id: boardId },
                    user: { id: user.id }
                },
                relations: ['role', 'role.permissions']
            })

            if (!membership) {
                return next(errorResponse(Status.NOT_FOUND, 'Membership not found'))
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
            console.log(membership)
            if (!membership) {
                return false
            }
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

            const hasRole = roles.some((role) => {
                console.log('Checking role:', role, 'against membership role:', membership.role.name)
                return membership.role.name === role
            })
            return hasRole
        })
        .catch(() => {
            return false
        })
}
