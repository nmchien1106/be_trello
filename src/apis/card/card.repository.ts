import { Card } from '@/entities/card.entity'
import { List } from '@/entities/list.entity'
import { CardMembers } from '@/entities/card-member.entity'
import AppDataSource from '@/config/typeorm.config'
import { Config } from '@/config/config'
import { DeepPartial } from 'typeorm'

class CardRepository {
    private repo = AppDataSource.getRepository(Card)
    private cardMemberRepo = AppDataSource.getRepository(CardMembers)

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
                backgroundUrl: data.coverUrl ?? null,
                dueDate: dueDateVal,
                priority: data.priority ?? 'medium'
            }as DeepPartial<Card>)

            return await manager.save(newCard)
        })
    }

    getCardById = async (cardId: string) => {
        return await this.repo.findOne({
            where: { id: cardId },
            relations: ['list'],
            select: {
                list: {
                    id: true
                }
            }
        })
    }

    getCardsByListId = async (listId: string) => {
        return await this.repo.find({
            where: { list: { id: listId } },
            order: { position: 'ASC' }
        })
    }

    deleteCardsByListId = async (listId: string, manager?: any) => {
        if (manager) {
            await manager.delete(Card, { list: { id: listId } })
        } else {
            await AppDataSource.getRepository(Card).delete({ list: { id: listId } })
        }
    }

    findById = async (id: string) => {
        return await this.repo.findOne({
            where: { id },
            relations: ['list', 'list.board']
        })
    }

    updateCard = async (id: string, data: any) => {
        await this.repo.update(id, data)
        return this.repo.findOneBy({ id })
    }

    deleteCard = async (id: string) => {
        await this.repo.delete(id)
    }

    findMemberById = async (cardId: string, memberId: string): Promise<CardMembers | null> => {
        return await this.cardMemberRepo.findOne({
            where: { card: { id: cardId }, user: { id: memberId } }
        })
    }

    addMemberToCard = async (cardId: string, memberId: string): Promise<CardMembers> => {
        const cardMember = this.cardMemberRepo.create({
            card: { id: cardId },
            user: { id: memberId }
        })
        return await this.cardMemberRepo.save(cardMember)
    }

    getBoardIdFromCard = async (cardId: string): Promise<string> => {
        const card = await this.repo.findOne({
            where: { id: cardId },
            relations: ['list', 'list.board']
        })
        return card?.list.board.id as string
    }

    getMembersOfCard = async (cardId: string): Promise<CardMembers[]> => {
        return await this.cardMemberRepo.find({
            where: { card: { id: cardId } },
            relations: ['user']
        })
    }

    removeMemberFromCard = async (cardId: string, memberId: string): Promise<void> => {
        await this.cardMemberRepo.delete({
            card: { id: cardId },
            user: { id: memberId }
        })
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
            relations: ['list', 'list.board', 'cardMembers', 'cardMembers.user'] 
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
                backgroundUrl: sourceCard.backgroundUrl,
                priority: sourceCard.priority,
                dueDate: sourceCard.dueDate,
                list: targetList,
                position: newPos,
                isArchived: false
            })
            const savedCard = await manager.save(newCard)

            if (sourceCard.cardMembers && sourceCard.cardMembers.length > 0) {
                const newMembers = sourceCard.cardMembers.map(cm =>
                    manager.create(CardMembers, {
                        card: savedCard,
                        user: cm.user
                    })
                )
                await manager.save(newMembers)
            }

            return savedCard
        })
    }

    async getListByCardId(cardId: string) {
        const card = await this.repo.findOne({
            where: { id: cardId },
            relations: ['list'],
            select: {
                list: {
                    id: true,
                    title: true,
                    position: true,
                    isArchived: true,
                    boardId: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
        })
        return card?.list || null
    }
}

export default new CardRepository()