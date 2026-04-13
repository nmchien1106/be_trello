import { DataSource } from 'typeorm'

import { Board } from '../../src/entities/board.entity'
import { BoardMembers } from '../../src/entities/board-member.entity'
import { Role } from '../../src/entities/role.entity'
import { User } from '../../src/entities/user.entity'
import { Workspace } from '../../src/entities/workspace.entity'
import { userFixtureByKey, workspaceFixtureByKey, boardFixtures } from './fixtures'

export async function seedBoards(dataSource: DataSource): Promise<void> {
    const boardRepo = dataSource.getRepository(Board)
    const boardMemberRepo = dataSource.getRepository(BoardMembers)
    const workspaceRepo = dataSource.getRepository(Workspace)
    const userRepo = dataSource.getRepository(User)
    const roleRepo = dataSource.getRepository(Role)

    const boardAdminRole = await roleRepo.findOne({ where: { name: 'board_admin' } })
    const boardMemberRole = await roleRepo.findOne({ where: { name: 'board_member' } })

    if (!boardAdminRole || !boardMemberRole) {
        throw new Error('Missing board roles. Run role seeder first.')
    }

    for (const fixture of boardFixtures) {
        const workspaceFixture = workspaceFixtureByKey[fixture.workspaceKey]
        const workspace = await workspaceRepo.findOne({ where: { title: workspaceFixture.title } })

        if (!workspace) {
            throw new Error(`Workspace not found for board ${fixture.title}. Run workspace seeder first.`)
        }

        const ownerFixture = userFixtureByKey[fixture.ownerKey]
        const owner = await userRepo.findOne({ where: { email: ownerFixture.email } })
        if (!owner) {
            throw new Error(`Board owner not found: ${ownerFixture.email}`)
        }

        let board = await boardRepo.findOne({
            where: {
                title: fixture.title,
                workspace: { id: workspace.id }
            },
            relations: ['workspace']
        })

        if (!board) {
            board = boardRepo.create({
                title: fixture.title,
                description: fixture.description,
                permissionLevel: fixture.permissionLevel,
                owner,
                workspace,
                backgroundPath: `https://picsum.photos/seed/${fixture.key}/1400/900`
            })
            board = await boardRepo.save(board)
            console.log(`Created board: ${fixture.title}`)
        }

        const memberKeys = Array.from(new Set([fixture.ownerKey, ...fixture.memberKeys]))
        for (const memberKey of memberKeys) {
            const memberFixture = userFixtureByKey[memberKey]
            const user = await userRepo.findOne({ where: { email: memberFixture.email } })
            if (!user) {
                throw new Error(`Board member not found: ${memberFixture.email}`)
            }

            const role = memberKey === fixture.ownerKey ? boardAdminRole : boardMemberRole
            const existedMember = await boardMemberRepo.findOne({
                where: {
                    board: { id: board.id },
                    user: { id: user.id }
                },
                relations: ['board', 'user']
            })

            if (!existedMember) {
                await boardMemberRepo.save(
                    boardMemberRepo.create({
                        board,
                        user,
                        role,
                        isStarred: memberKey === fixture.ownerKey
                    })
                )
                continue
            }

            existedMember.role = role
            if (memberKey === fixture.ownerKey) {
                existedMember.isStarred = true
            }
            await boardMemberRepo.save(existedMember)
        }
    }

    console.log('Seeded boards and board members successfully.')
}
