import { DataSource } from 'typeorm'

import { Board } from '../../src/entities/board.entity'
import { List } from '../../src/entities/list.entity'
import { User } from '../../src/entities/user.entity'
import { boardFixtureByKey, listFixtures, userFixtureByKey } from './fixtures'

export async function seedLists(dataSource: DataSource): Promise<void> {
    const boardRepo = dataSource.getRepository(Board)
    const listRepo = dataSource.getRepository(List)
    const userRepo = dataSource.getRepository(User)

    for (const fixture of listFixtures) {
        const boardFixture = boardFixtureByKey[fixture.boardKey]
        const board = await boardRepo.findOne({ where: { title: boardFixture.title } })
        if (!board) {
            throw new Error(`Board not found for list ${fixture.title}. Run board seeder first.`)
        }

        const createdByFixture = userFixtureByKey[fixture.createdByKey]
        const createdBy = await userRepo.findOne({ where: { email: createdByFixture.email } })
        if (!createdBy) {
            throw new Error(`List creator not found: ${createdByFixture.email}`)
        }

        let list = await listRepo.findOne({
            where: {
                title: fixture.title,
                boardId: board.id
            }
        })

        if (!list) {
            list = listRepo.create({
                title: fixture.title,
                boardId: board.id,
                position: fixture.position,
                createdBy
            })
            await listRepo.save(list)
            console.log(`Created list: ${fixture.title}`)
            continue
        }

        list.position = fixture.position
        list.createdBy = createdBy
        await listRepo.save(list)
    }

    console.log('Seeded lists successfully.')
}
