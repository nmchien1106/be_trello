import { DataSource } from 'typeorm'

import { Board } from '../../src/entities/board.entity'
import { Card } from '../../src/entities/card.entity'
import { CardLabel } from '../../src/entities/card-label.entity'
import { Label } from '../../src/entities/label.entity'
import { boardFixtureByKey, cardFixtureByKey, labelFixtures } from './fixtures'

export async function seedLabels(dataSource: DataSource): Promise<void> {
    const boardRepo = dataSource.getRepository(Board)
    const cardRepo = dataSource.getRepository(Card)
    const labelRepo = dataSource.getRepository(Label)
    const cardLabelRepo = dataSource.getRepository(CardLabel)

    for (const fixture of labelFixtures) {
        const boardFixture = boardFixtureByKey[fixture.boardKey]
        const board = await boardRepo.findOne({ where: { title: boardFixture.title } })
        if (!board) {
            throw new Error(`Board not found for label ${fixture.name}. Run board seeder first.`)
        }

        let label = await labelRepo.findOne({
            where: {
                board: { id: board.id },
                name: fixture.name
            },
            relations: ['board']
        })

        if (!label) {
            label = labelRepo.create({
                board,
                name: fixture.name,
                color: fixture.color
            })
            label = await labelRepo.save(label)
            console.log(`Created label: ${fixture.name}`)
        } else {
            label.color = fixture.color
            label = await labelRepo.save(label)
        }

        for (const cardKey of fixture.cardKeys) {
            const cardFixture = cardFixtureByKey[cardKey]
            const card = await cardRepo.findOne({ where: { title: cardFixture.title } })
            if (!card) {
                throw new Error(`Card not found for label relation: ${cardFixture.title}`)
            }

            const existedCardLabel = await cardLabelRepo.findOne({
                where: {
                    card: { id: card.id },
                    label: { id: label.id }
                },
                relations: ['card', 'label']
            })

            if (!existedCardLabel) {
                await cardLabelRepo.save(cardLabelRepo.create({ card, label }))
            }
        }
    }

    console.log('Seeded labels and card labels successfully.')
}
