import AppDataSource from '@/config/typeorm.config'
import CardRepository from './card.repository'
import ListRepository from '../list/list.repository'
import BoardRepository from '../board/board.repository'
import { CreateCardDto } from './card.dto'
import { Status } from '@/types/response'
import { Permissions } from '@/enums/permissions.enum'
import { Card } from '@/entities/card.entity'
import { List } from '@/entities/list.entity'
import { Config } from '@/config/config'

export class CardService {
    async createCard(data: CreateCardDto, userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }

        const list = await ListRepository.findById(data.listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        try {
            return await AppDataSource.transaction(async (manager) => {
                const lastCard = await manager.findOne(Card, {
                    where: { list: { id: data.listId } },
                    order: { position: 'DESC' },
                    lock: { mode: 'pessimistic_write' }
                })

                const newPosition = lastCard ? lastCard.position + Config.defaultGap : Config.defaultGap

                const newCard = manager.create(Card, {
                    title: data.title,
                    list: { id: data.listId } as any,
                    position: newPosition,
                    description: data.description || null,
                    coverUrl: data.coverUrl || null,
                    priority: data.priority || 'medium',
                    dueDate: data.dueDate ? new Date(data.dueDate) : null
                })

                const savedCard = await manager.save(newCard)

                return savedCard
            })
        } catch (error: any) {
            throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create card failed' }
        }
    }

    async updateCard(cardId: string, data: any, userId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        const updated = await CardRepository.updateCard(cardId, data)
        return updated
    }

    async deleteCard(cardId: string, userId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await CardRepository.deleteCard(cardId)
        return;
    }
}

export default new CardService()
