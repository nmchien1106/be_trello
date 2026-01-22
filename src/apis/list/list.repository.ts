import { List } from '@/entities/list.entity'
import { Card } from '@/entities/card.entity'
import AppDataSource from '@/config/typeorm.config'
import { Board } from '@/entities/board.entity'
import { Config } from '@/config/config'
import { CardMembers } from '@/entities/card-member.entity'
import boardRepository from '../board/board.repository'

class ListRepository {
    private repo = AppDataSource.getRepository(List)

    async getAllListsInBoard(boardId: string): Promise<List[]> {
        return await this.repo.find({
            where: { board: { id: boardId } },
            order: { position: 'ASC' }
        })
    }
    async findListById(id: string): Promise<List | null> {
        return await this.repo.findOne({ where: { id } })
    }

    async findById(id: string) {
        return await this.repo.findOne({
            where: { id },
            relations: ['board'],
            select: {
                id: true,
                title: true,
                position: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,
                board: {
                    id: true
                }
            }
        })
    }

    async createList(data: { title: string; boardId: string }, userId?: string) {
        return await AppDataSource.transaction(async (manager) => {
            const board = await manager.findOne(Board, {
                where: { id: data.boardId }
            })

            if (!board) {
                const e: any = new Error('Board not found')
                e.status = 404
                throw e
            }

            const hightestPosition = await this.getHighestPositionInBoard(data.boardId) || Config.defaultGap
            const newList = manager.create(List, {
                title: data.title,
                position: hightestPosition + Config.defaultGap,
                board,
                ...(userId ? { createdBy: { id: userId } as any } : {})
            })

            return await manager.save(newList)
        })
    }

    async updateList(id: string, data: Partial<List>) {
        await this.repo.update(id, data)
        return await this.findById(id)
    }

    async getListDetail(id: string) {
        return await this.repo.findOne({
            where: { id },
            relations: ['cards', 'board'],
            order: {
                cards: { position: 'ASC' }
            },
            select: {
                id: true,
                title: true,
                position: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,
                board: {
                    id: true
                },
            }
        })
    }

    async deleteList(id: string) {
        return await AppDataSource.transaction(async (manager) => {
            await manager.delete(Card, { list: { id } })
            await manager.delete(List, { id })
            return true
        })
    }

    async getHighestPositionInBoard(boardId: string): Promise<number | null> {
        const list = await this.repo.findOne({
            where: { board: { id: boardId } },
            order: { position: 'DESC' }
        })
        return list ? list.position : null
    }

    async duplicateList(sourceListId: string, targetBoardId: string, title?: string, userId?: string): Promise<List> {
        return await AppDataSource.transaction(async (manager) => {
            const sourceList = await manager.findOne(List, {
                where: { id: sourceListId },
                relations: ['cards', 'cards.cardMembers', 'cards.cardMembers.user']
            })
            if (!sourceList) throw new Error('Source list not found')

            const lastList = await manager.findOne(List, {
                where: { board: { id: targetBoardId } },
                order: { position: 'DESC' }
            })
            const newPos = lastList ? lastList.position + Config.defaultGap : Config.defaultGap

            const newList = manager.create(List, {
                title: title || `${sourceList.title} (Copy)`,
                position: newPos,
                board: { id: targetBoardId } as any,
                createdBy: userId ? ({ id: userId } as any) : undefined
            })
            const savedList = await manager.save(newList)

            if (sourceList.cards?.length > 0) {
                for (const card of sourceList.cards) {
                    if (card.isArchived) continue; // Bỏ qua card đã archive (tùy chọn)

                    const newCard = manager.create(Card, {
                        title: card.title,
                        description: card.description,
                        position: card.position,
                        coverUrl: card.coverUrl,
                        priority: card.priority,
                        dueDate: card.dueDate,
                        list: savedList,
                        isArchived: false
                    })
                    const savedCard = await manager.save(newCard)

                    if (card.cardMembers?.length > 0) {
                        const newMembers = card.cardMembers.map(cm =>
                            manager.create(CardMembers, {
                                card: savedCard,
                                user: cm.user
                            })
                        )
                        await manager.save(newMembers)
                    }
                }
            }

            return savedList
        })
    }

    async getAllCardsInList(listId: string, userId: string) {
        const list = await this.repo.findOne({
            where: { id: listId },
            relations: ['cards', 'cards.list'],
            select: {
                id: true,
                cards: {
                    id: true,
                    title: true,
                    position: true,
                    backgroundUrl: true,
                    priority: true,
                    dueDate: true,
                    description: true,
                    isArchived: true,
                    createdAt: true,
                    updatedAt: true,
                    list: { id: true}
                }
            },
            order: { cards: { position: 'ASC' } }
        })

        if (!list) {
            throw { status: 404, message: 'List not found' }
        }

        return list.cards
    }
}

export default new ListRepository()