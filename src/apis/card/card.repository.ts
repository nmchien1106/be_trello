import { Card } from '@/entities/card.entity'
import { List } from '@/entities/list.entity'
import { CardMembers } from '@/entities/card-member.entity'
import AppDataSource from '@/config/typeorm.config'
import { Config } from '@/config/config'

class CardRepository {
    private repo = AppDataSource.getRepository(Card)

    async createCard(data: {
        title: string
        listId: string
        description?: string | null
        coverUrl?: string | null
        dueDate?: string | null
        priority?: 'low' | 'medium' | 'high'
    }) {
        return await AppDataSource.transaction(async (manager) => {
            const list = await manager.findOne(List, { where: { id: data.listId } })
            if (!list) {
                const e: any = new Error('List not found')
                e.status = 404
                throw e
            }

            const lastCard = await manager.findOne(Card, {
                where: { list: { id: data.listId } },
                order: { position: 'DESC' }
            })

            const lastPos = lastCard && typeof lastCard.position === 'number' ? lastCard.position : -1
            const newPosition = lastPos + 1

            const dueDateVal = data.dueDate ? new Date(data.dueDate) : null

            const newCard = manager.create(Card, {
                title: data.title,
                position: newPosition,
                list: list,
                description: data.description ?? null,
                coverUrl: data.coverUrl ?? null,
                dueDate: dueDateVal,
                priority: data.priority ?? 'medium'
            })

            return await manager.save(newCard)
        })
    }

    getCardById = async (cardId: string) => {
        return await this.repo.findOne({
            where: { id: cardId },
            relations: ['list'],
            select: {
                list: {
                    id: true,
                }
            }
        })
    }

    async getCardsByListId(listId: string) {
        return await this.repo.find({
            where: { list: { id: listId } },
            order: { position: 'ASC' }
        })
    }


    async deleteCardsByListId(listId: string, manager?: any) {
        if (manager) {
            await manager.delete(Card, { list: { id: listId } })
        } else {
            await AppDataSource.getRepository(Card).delete({ list: { id: listId } })
        }
    }

    async findById(id: string) {
        return await this.repo.findOne({
            where: { id },
            relations: ['list', 'list.board']
        })
    }

    async updateCard(id: string, data: any) {
        await this.repo.update(id, data)
        return this.repo.findOneBy({ id })
    }

    async deleteCard(id: string) {
        await this.repo.delete(id)
    }

    async findCardWithBoard(id: string) {
        return await this.repo.findOne({
            where: { id },
            relations: ['list', 'list.board']
        })
    }

    async findCardForDuplicate(id: string) {
        return await this.repo.findOne({
            where: { id },
            relations: ['list', 'list.board', 'cardMembers', 'cardMembers.user', 'cardMembers.role']
        })
    }

    async getHighestPositionInList(listId: string): Promise<number | null> {
        const card = await this.repo.findOne({
            where: { list: { id: listId }, isArchived: false },
            order: { position: 'DESC' }
        })
        return card ? card.position : null
    }

    async duplicateCard(sourceCard: Card, targetListId: string, newTitle?: string) {
        return await AppDataSource.transaction(async (manager) => {
            const targetList = await manager.findOne(List, { where: { id: targetListId } })
            if (!targetList) throw new Error('Target list not found')

            const lastCard = await manager.findOne(Card, {
                where: { list: { id: targetListId }, isArchived: false },
                order: { position: 'DESC' }
            })
            const newPos = lastCard ? lastCard.position + Config.defaultGap : Config.defaultGap

            const newCard = manager.create(Card, {
                title: newTitle ? newTitle : `${sourceCard.title} Copy`,
                description: sourceCard.description,
                coverUrl: sourceCard.coverUrl,
                priority: sourceCard.priority,
                dueDate: sourceCard.dueDate,
                list: targetList,
                position: newPos,
                isArchived: false
            })
            const savedCard = await manager.save(newCard)

            if (sourceCard.cardMembers?.length) {
                const newMembers = sourceCard.cardMembers.map(cm => 
                    manager.create(CardMembers, {
                        card: savedCard,
                        user: cm.user,
                        role: cm.role
                    })
                )
                await manager.save(newMembers)
            }

            return savedCard
        })
    }
}

export default new CardRepository()
