import { DataSource } from 'typeorm'

import { Role } from '../../src/entities/role.entity'
import { User } from '../../src/entities/user.entity'
import { Workspace } from '../../src/entities/workspace.entity'
import { WorkspaceMembers } from '../../src/entities/workspace-member.entity'
import { userFixtureByKey, workspaceFixtures } from './fixtures'

export async function seedWorkspaces(dataSource: DataSource): Promise<void> {
    const userRepo = dataSource.getRepository(User)
    const roleRepo = dataSource.getRepository(Role)
    const workspaceRepo = dataSource.getRepository(Workspace)
    const workspaceMemberRepo = dataSource.getRepository(WorkspaceMembers)

    const workspaceAdminRole = await roleRepo.findOne({ where: { name: 'workspace_admin' } })
    const workspaceMemberRole = await roleRepo.findOne({ where: { name: 'workspace_member' } })

    if (!workspaceAdminRole || !workspaceMemberRole) {
        throw new Error('Missing workspace roles. Run role seeder first.')
    }

    for (const fixture of workspaceFixtures) {
        const ownerFixture = userFixtureByKey[fixture.ownerKey]
        const owner = await userRepo.findOne({ where: { email: ownerFixture.email } })
        if (!owner) {
            throw new Error(`Owner not found for workspace ${fixture.title}. Run user seeder first.`)
        }

        let workspace = await workspaceRepo.findOne({
            where: { title: fixture.title, owner: { id: owner.id } },
            relations: ['owner']
        })

        if (!workspace) {
            workspace = workspaceRepo.create({
                title: fixture.title,
                description: fixture.description,
                owner
            })
            workspace = await workspaceRepo.save(workspace)
            console.log(`Created workspace: ${fixture.title}`)
        }

        const memberKeys = Array.from(new Set([fixture.ownerKey, ...fixture.memberKeys]))

        for (const memberKey of memberKeys) {
            const memberFixture = userFixtureByKey[memberKey]
            const memberUser = await userRepo.findOne({ where: { email: memberFixture.email } })
            if (!memberUser) {
                throw new Error(`Member not found: ${memberFixture.email}`)
            }

            const role = memberKey === fixture.ownerKey ? workspaceAdminRole : workspaceMemberRole

            const existedMembership = await workspaceMemberRepo.findOne({
                where: {
                    workspace: { id: workspace.id },
                    user: { id: memberUser.id }
                },
                relations: ['workspace', 'user']
            })

            if (!existedMembership) {
                await workspaceMemberRepo.save(
                    workspaceMemberRepo.create({
                        workspace,
                        user: memberUser,
                        role,
                        status: 'accepted'
                    })
                )
                continue
            }

            existedMembership.role = role
            existedMembership.status = 'accepted'
            await workspaceMemberRepo.save(existedMembership)
        }
    }

    console.log('Seeded workspaces and workspace members successfully.')
}
