import { Permission } from './../src/entities/permission.entity'
import { DataSource } from 'typeorm'
import { Role } from '../src/entities/role.entity'

export class seedAuthorization {
    constructor(private dataSource: DataSource) {}

    async init() {
        const roleRepository = this.dataSource.getRepository(Role)
        const permissionRepository = this.dataSource.getRepository(Permission)

        // =============================
        //       Seed permmissions
        // =============================

        const permissionData = [
            // user permissions
            { name: 'user:read', description: 'Read user information' },
            { name: 'user:manage', description: 'Manage all users (admin only)' },
            { name: 'user:update', description: 'Update user information' },
            { name: 'user:delete', description: 'Delete a user' },

            // workspace permissions
            { name: 'workspace:create', description: 'Create a new workspace' },
            { name: 'workspace:read', description: 'Read workspace information' },
            { name: 'workspace:update', description: 'Update workspace information' },
            { name: 'workspace:delete', description: 'Delete a workspace' },
            { name: 'workspace:manage', description: 'Full workspace administrators' },
            { name: 'workspace:add_member', description: 'Add a member to a workspace' },
            { name: 'workspace:remove_member', description: 'Remove a member from a workspace' },
            { name: 'workspace:change_member_role', description: "Change a member's role in a workspace" },
            { name: 'workspace:read_members', description: 'Read workspace members' },

            //board permissions
            { name: 'board:create', description: 'Create a board' },
            { name: 'board:read', description: 'Read board' },
            { name: 'board:update', description: 'Update board' },
            { name: 'board:delete', description: 'Delete board' },
            { name: 'board:add_member', description: 'Add member to board' },
            { name: 'board:remove_member', description: 'Remove member from board' },
            { name: 'board:change_permission_level', description: 'Change board permission level' },
            { name: 'board:revoke_share_link', description: 'Revoke share link' },
            { name: 'board:manage', description: 'Full board administrators' },
            { name: 'board:read_members', description: 'Read board members' },
            { name: 'board:update_member_role', description: 'Update member role' }
        ]

        // save permissions
        const createdPermissions: Permission[] = []
        for (const permData of permissionData) {
            let permission = await permissionRepository.findOneBy({ name: permData.name })
            if (!permission) {
                permission = permissionRepository.create({
                    name: permData.name,
                    description: permData.description
                })
                await permissionRepository.save(permission)
                console.log('Created permission: ', permData.name)
            } else {
                console.log('Permission already exists: ', permData.name)
            }
            createdPermissions.push(permission)
        }

        // =============================
        //         Seed roles
        // =============================
        const roleData = [
            { name: 'admin', description: 'Administrator with full access', permissions: createdPermissions },
            {
                name: 'workspace_admin',
                description: 'Workspace administrator with elevated access',
                permissions: createdPermissions.filter(perm => perm.name.includes('workspace:') || perm.name === 'board:create')
            },
            {
                name: 'user',
                description: 'Regular user with limited access',
                permissions: createdPermissions.filter(
                    (perm) =>
                        perm.name === 'user:read' ||
                        perm.name === 'user:update' ||
                        perm.name === 'workspace:read' ||
                        perm.name === 'workspace:create'
                )
            },
            {
                name: 'guest',
                description: 'Guest user with minimal access',
                permissions: createdPermissions.filter((perm) => perm.name === 'workspace:read')
            },
            {
                name: 'workspace_member',
                description: 'Workspace member with standard access',
                permissions: createdPermissions.filter(
                    (perm) =>
                        perm.name === 'workspace:read' ||
                        perm.name === 'workspace:update' ||
                        perm.name === 'workspace:read_members' ||
                        perm.name === 'board:create'
                )
            },
            {
                name: 'board_admin',
                description: 'Board administrator with full access to board',
                permissions: createdPermissions.filter((perm) => perm.name.includes('board:'))
            },
            {
                name: 'board_member',
                description: 'Board member with limited access',
                permissions: createdPermissions.filter(
                    (perm) =>
                        perm.name === 'board:read' ||
                        perm.name === 'board:update' ||
                        perm.name === 'board:read_members' ||
                        perm.name === 'board:add_member'
                )
            },
            {
                name: 'board_viewer',
                description: 'Board viewer with read-only access',
                permissions: createdPermissions.filter(
                    (perm) =>
                        perm.name === 'board:read' ||
                        perm.name === 'board:read_members'
                )
            }
        ]

        // save roles
        for (const roleInfo of roleData) {
            let role = await roleRepository.findOne({
                where: { name: roleInfo.name },
                relations: ['permissions']
            })

            if (!role) {
                role = roleRepository.create({
                    name: roleInfo.name,
                    description: roleInfo.description,
                    permissions: roleInfo.permissions
                })
                await roleRepository.save(role)
                console.log(' Created role: ', roleInfo.name)
            } else {
                console.log('Role already exists: ', roleInfo.name)
                if (roleInfo.permissions) {
                    role.permissions = roleInfo.permissions
                    await roleRepository.save(role)
                    console.log('Updated permissions for role: ', roleInfo.name)
                }
            }
        }

        console.log('Authorization seeding completed.')
    }
}
