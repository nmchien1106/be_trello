import { Card } from '@/entities/card.entity'
import { List } from '@/entities/list.entity'
import AppDataSource from '@/config/typeorm.config'
import { CardMembers } from '@/entities/card-member.entity'

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
            where: { id: cardId, user: { id: memberId } }
        })
    }

    addMemberToCard = async (cardId: string, memberId: string): Promise<CardMembers> => {
        const cardMember = this.cardMemberRepo.create({
            card: { id: cardId },
            user: { id: memberId },
        })
        return await this.cardMemberRepo.save(cardMember)
    }

    getBoardIdFromCard = async (cardId: string): Promise<string > => {
        const card = await this.repo.findOne({
            where: { id: cardId },
            relations: ['list', 'list.board'],
        })
        return card?.list.board.id as string
    }
}

export default new CardRepository()
