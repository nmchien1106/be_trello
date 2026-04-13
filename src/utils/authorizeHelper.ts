import { Permission } from '@/enums/permissions.enum'
import DataSource from '@/config/typeorm.config'
import { BoardMembers } from '@/entities/board-member.entity'
import { WorkspaceMembers } from '@/entities/workspace-member.entity'
import { Role } from '@/entities/role.entity'
import { Board } from '@/entities/board.entity'

export const checkBoardAccess = async (userId: string, boardId: string, permission: Permission) => {}
export const checkWorkspaceAccess = async (userId: string, workspaceId: string, permission: Permission) => {}

const RoleScope = {
    WORKSPACE: 'WORKSPACE',
    BOARD: 'BOARD',
    GLOBAL: 'GLOBAL'
} as const

export interface Membership {
    role: Role
    scope: keyof typeof RoleScope
}

export const canUserAccess = async (
    userId: string,
    permission: string,
    context?: { workspaceId?: string; boardId?: string }
) => {
    const { workspaceId, boardId } = context || {}

    if (boardId && typeof permission === 'string') {
        const board = await DataSource.getRepository(Board).findOne({
            where: { id: boardId },
            relations: ['workspace']
        })

        if (board) {
            if (board.permissionLevel === 'public') {
                return true
            }

            if (board.permissionLevel === 'workspace' && board.workspace?.id) {
                const wsMember = await DataSource.getRepository(WorkspaceMembers).findOne({
                    where: {
                        user: { id: userId },
                        workspace: { id: board.workspace.id },
                        status: 'accepted'
                    }
                })

                if (wsMember) {
                    return true
                }
            }
        }
    }

    const memberships = await getMembership(userId, {
        ...(workspaceId && { workspaceId }),
        ...(boardId && { boardId })
    })

    if (memberships.length == 0) {
        return false
    }
    const priority = {
        [RoleScope.BOARD]: 3,
        [RoleScope.WORKSPACE]: 2,
        [RoleScope.GLOBAL]: 1
    } as const

    memberships.sort((a, b) => priority[b.scope] - priority[a.scope])

    for (const membership of memberships) {
        const hasPerm = await roleHashPermissions(membership.role, permission)
        if (hasPerm) {
            return true
        }
    }
    return false
}

const getMembership = async (userId: string, context?: { workspaceId?: string; boardId?: string }) => {
    const { workspaceId, boardId } = context || {}

    const memberships: Membership[] = []

    if (boardId) {
        const boardMember = await DataSource.getRepository(BoardMembers).findOne({
            where: { user: { id: userId }, board: { id: boardId } },
            relations: ['role', 'role.permissions']
        })

        if (boardMember) {
            memberships.push({
                role: boardMember.role,
                scope: RoleScope.BOARD
            })
        }
    }

    if (workspaceId) {
        const workspaceMember = await DataSource.getRepository(WorkspaceMembers).findOne({
            where: { user: { id: userId }, workspace: { id: workspaceId }, status: 'accepted' },
            relations: ['role', 'role.permissions']
        })

        if (workspaceMember) {
            memberships.push({
                role: workspaceMember.role,
                scope: RoleScope.WORKSPACE
            })
        }
    }

    return memberships
}

const roleHashPermissions = (role: Role, requiredPermission: string | string[]): boolean => {
    if (!role.permissions || role.permissions.length === 0) {
        return false
    }

    return role.permissions.some((perm) => {
        if (Array.isArray(requiredPermission)) {
            return requiredPermission.includes(perm.name)
        }
        return perm.name === requiredPermission
    })
}
