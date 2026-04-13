import { DataSource } from 'typeorm'

import { Card } from '../../src/entities/card.entity'
import { Checklist } from '../../src/entities/checklist.entity'
import { ChecklistItem } from '../../src/entities/checklist-item.entity'
import { cardFixtureByKey, checklistFixtures } from './fixtures'

export async function seedChecklists(dataSource: DataSource): Promise<void> {
    const cardRepo = dataSource.getRepository(Card)
    const checklistRepo = dataSource.getRepository(Checklist)
    const checklistItemRepo = dataSource.getRepository(ChecklistItem)

    for (const fixture of checklistFixtures) {
        const cardFixture = cardFixtureByKey[fixture.cardKey]
        const card = await cardRepo.findOne({ where: { title: cardFixture.title } })
        if (!card) {
            throw new Error(`Card not found for checklist ${fixture.title}. Run card seeder first.`)
        }

        let checklist = await checklistRepo.findOne({
            where: {
                title: fixture.title,
                card: { id: card.id }
            },
            relations: ['card']
        })

        if (!checklist) {
            checklist = checklistRepo.create({
                title: fixture.title,
                card
            })
            checklist = await checklistRepo.save(checklist)
            console.log(`Created checklist: ${fixture.title}`)
        }

        for (const itemFixture of fixture.items) {
            const existedItem = await checklistItemRepo.findOne({
                where: {
                    content: itemFixture.content,
                    checklist: { id: checklist.id }
                },
                relations: ['checklist']
            })

            if (!existedItem) {
                await checklistItemRepo.save(
                    checklistItemRepo.create({
                        content: itemFixture.content,
                        isChecked: itemFixture.isChecked,
                        position: itemFixture.position,
                        checklist
                    })
                )
                continue
            }

            existedItem.isChecked = itemFixture.isChecked
            existedItem.position = itemFixture.position
            await checklistItemRepo.save(existedItem)
        }
    }

    console.log('Seeded checklists and checklist items successfully.')
}
