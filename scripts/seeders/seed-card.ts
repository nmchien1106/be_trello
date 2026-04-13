import { DataSource } from 'typeorm'

import { Card } from '../../src/entities/card.entity'
import { CardMembers } from '../../src/entities/card-member.entity'
import { List } from '../../src/entities/list.entity'
import { User } from '../../src/entities/user.entity'
import { cardFixtures, listFixtureByKey, userFixtureByKey } from './fixtures'

export async function seedCards(dataSource: DataSource): Promise<void> {
    const cardRepo = dataSource.getRepository(Card)
    const listRepo = dataSource.getRepository(List)
    const userRepo = dataSource.getRepository(User)
    const cardMemberRepo = dataSource.getRepository(CardMembers)

    for (const fixture of cardFixtures) {
        const listFixture = listFixtureByKey[fixture.listKey]
        const list = await listRepo.findOne({ where: { title: listFixture.title } })
        if (!list) {
            throw new Error(`List not found for card ${fixture.title}. Run list seeder first.`)
        }

        const creatorFixture = userFixtureByKey[fixture.createdByKey]
        const creator = await userRepo.findOne({ where: { email: creatorFixture.email } })
        if (!creator) {
            throw new Error(`Card creator not found: ${creatorFixture.email}`)
        }

        let card = await cardRepo.findOne({
            where: {
                title: fixture.title,
                list: { id: list.id }
            },
            relations: ['list']
        })

        const dueDate = new Date(Date.now() + fixture.dueInDays * 24 * 60 * 60 * 1000)

        if (!card) {
            card = cardRepo.create({
                title: fixture.title,
                description: fixture.description,
                list,
                position: fixture.position,
                priority: fixture.priority,
                dueDate,
                createdBy: creator
            })
            card = await cardRepo.save(card)
            console.log(`Created card: ${fixture.title}`)
        } else {
            card.description = fixture.description
            card.position = fixture.position
            card.priority = fixture.priority
            card.dueDate = dueDate
            card.createdBy = creator
            card = await cardRepo.save(card)
        }

        for (const assigneeKey of fixture.assigneeKeys) {
            const assigneeFixture = userFixtureByKey[assigneeKey]
            const assignee = await userRepo.findOne({ where: { email: assigneeFixture.email } })
            if (!assignee) {
                throw new Error(`Card assignee not found: ${assigneeFixture.email}`)
            }

            const existedMember = await cardMemberRepo.findOne({
                where: {
                    card: { id: card.id },
                    user: { id: assignee.id }
                },
                relations: ['card', 'user']
            })

            if (!existedMember) {
                await cardMemberRepo.save(cardMemberRepo.create({ card, user: assignee }))
            }
        }
    }

    console.log('Seeded cards and card members successfully.')
}
