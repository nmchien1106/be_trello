import { DataSource } from 'typeorm'

import { PERMISSIONS } from '../../src/enums/permissions.enum'
import { Roles } from '../../src/enums/roles.enum'
import { Permission } from '../../src/entities/permission.entity'
import { Role } from '../../src/entities/role.entity'

type RolePermissionMap = Record<Roles, string[]>

const allPermissions = Object.values(PERMISSIONS)

const rolePermissionMap: RolePermissionMap = {
    [Roles.ADMIN]: allPermissions,
    [Roles.USER]: [
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.READ_USER,
        PERMISSIONS.UPDATE_USER,
        PERMISSIONS.CREATE_WORKSPACE,
        PERMISSIONS.READ_WORKSPACE,
        PERMISSIONS.READ_BOARD,
        PERMISSIONS.READ_LIST,
        PERMISSIONS.READ_CARD
    ],
    [Roles.WORKSPACE_ADMIN]: [
        PERMISSIONS.CREATE_WORKSPACE,
        PERMISSIONS.READ_WORKSPACE,
        PERMISSIONS.UPDATE_WORKSPACE,
        PERMISSIONS.DELETE_WORKSPACE,
        PERMISSIONS.ADD_MEMBER_TO_WORKSPACE,
        PERMISSIONS.REMOVE_MEMBER_FROM_WORKSPACE,
        PERMISSIONS.CHANGE_MEMBER_ROLE,
        PERMISSIONS.READ_WORKSPACE_MEMBERS,
        PERMISSIONS.MANAGE_WORKSPACE_PERMISSIONS,
        PERMISSIONS.CREATE_BOARD,
        PERMISSIONS.READ_BOARD,
        PERMISSIONS.UPDATE_BOARD,
        PERMISSIONS.DELETE_BOARD,
        PERMISSIONS.ADD_MEMBER_TO_BOARD,
        PERMISSIONS.REMOVE_MEMBER_FROM_BOARD,
        PERMISSIONS.CHANGE_BOARD_PERMISSION_LEVEL,
        PERMISSIONS.MANAGE_BOARD,
        PERMISSIONS.CREATE_LIST,
        PERMISSIONS.READ_LIST,
        PERMISSIONS.UPDATE_LIST,
        PERMISSIONS.DELETE_LIST,
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.UPDATE_CARD,
        PERMISSIONS.DELETE_CARD
    ],
    [Roles.WORKSPACE_MEMBER]: [
        PERMISSIONS.READ_WORKSPACE,
        PERMISSIONS.READ_WORKSPACE_MEMBERS,
        PERMISSIONS.READ_BOARD,
        PERMISSIONS.READ_LIST,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.UPDATE_CARD,
        PERMISSIONS.ADD_MEMBER_TO_CARD
    ],
    [Roles.BOARD_ADMIN]: [
        PERMISSIONS.CREATE_BOARD,
        PERMISSIONS.READ_BOARD,
        PERMISSIONS.UPDATE_BOARD,
        PERMISSIONS.DELETE_BOARD,
        PERMISSIONS.ADD_MEMBER_TO_BOARD,
        PERMISSIONS.REMOVE_MEMBER_FROM_BOARD,
        PERMISSIONS.CHANGE_BOARD_PERMISSION_LEVEL,
        PERMISSIONS.MANAGE_BOARD,
        PERMISSIONS.READ_BOARD_MEMBERS,
        PERMISSIONS.UPDATE_BOARD_MEMBER_ROLE,
        PERMISSIONS.UPDATE_BOARD_SETTINGS,
        PERMISSIONS.CREATE_LIST,
        PERMISSIONS.READ_LIST,
        PERMISSIONS.UPDATE_LIST,
        PERMISSIONS.DELETE_LIST,
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.UPDATE_CARD,
        PERMISSIONS.DELETE_CARD,
        PERMISSIONS.ADD_MEMBER_TO_CARD,
        PERMISSIONS.REMOVE_MEMBER_FROM_CARD
    ],
    [Roles.BOARD_MEMBER]: [
        PERMISSIONS.READ_BOARD,
        PERMISSIONS.READ_BOARD_MEMBERS,
        PERMISSIONS.READ_LIST,
        PERMISSIONS.CREATE_LIST,
        PERMISSIONS.UPDATE_LIST,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.UPDATE_CARD,
        PERMISSIONS.ADD_MEMBER_TO_CARD
    ],
    [Roles.LIST_ADMIN]: [
        PERMISSIONS.CREATE_LIST,
        PERMISSIONS.READ_LIST,
        PERMISSIONS.UPDATE_LIST,
        PERMISSIONS.DELETE_LIST,
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.UPDATE_CARD,
        PERMISSIONS.DELETE_CARD
    ],
    [Roles.LIST_MEMBER]: [
        PERMISSIONS.READ_LIST,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.UPDATE_CARD
    ],
    [Roles.CARD_ADMIN]: [
        PERMISSIONS.CREATE_CARD,
        PERMISSIONS.READ_CARD,
        PERMISSIONS.UPDATE_CARD,
        PERMISSIONS.DELETE_CARD,
        PERMISSIONS.ADD_MEMBER_TO_CARD,
        PERMISSIONS.REMOVE_MEMBER_FROM_CARD
    ],
    [Roles.CARD_MEMBER]: [PERMISSIONS.READ_CARD, PERMISSIONS.UPDATE_CARD],
    [Roles.BOARD_VIEWER]: [PERMISSIONS.READ_BOARD, PERMISSIONS.READ_LIST, PERMISSIONS.READ_CARD]
}

export async function seedRolesAndPermissions(dataSource: DataSource): Promise<void> {
    const permissionRepo = dataSource.getRepository(Permission)
    const roleRepo = dataSource.getRepository(Role)

    const permissionEntities: Record<string, Permission> = {}

    for (const permissionName of allPermissions) {
        let permission = await permissionRepo.findOne({ where: { name: permissionName } })
        if (!permission) {
            permission = permissionRepo.create({
                name: permissionName,
                description: `Permission ${permissionName}`
            })
            permission = await permissionRepo.save(permission)
            console.log(`Created permission: ${permissionName}`)
        }
        permissionEntities[permissionName] = permission
    }

    for (const roleName of Object.values(Roles)) {
        const rolePermissions = rolePermissionMap[roleName as Roles] ?? []
        const permissions = rolePermissions.map((name) => permissionEntities[name]).filter(Boolean)

        let role = await roleRepo.findOne({ where: { name: roleName }, relations: ['permissions'] })

        if (!role) {
            role = roleRepo.create({
                name: roleName,
                description: `System role ${roleName}`,
                permissions
            })
            await roleRepo.save(role)
            console.log(`Created role: ${roleName}`)
            continue
        }

        role.permissions = permissions
        role.description = role.description || `System role ${roleName}`
        await roleRepo.save(role)
        console.log(`Updated role permissions: ${roleName}`)
    }

    console.log('Seeded roles and permissions successfully.')
}
