import { List } from '@/entities/list.entity'
import { Card } from '@/entities/card.entity'
import AppDataSource from '@/config/typeorm.config'
import { Board } from '@/entities/board.entity'
import { Config } from '@/config/config'

class ListRepository {
    private repo = AppDataSource.getRepository(List)

    // legacy helper
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

            console.log(newList.position)
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
                cards: {
                    id: true,
                    title: true,
                    position: true,
                    coverUrl: true,
                    priority: true,
                    dueDate: true,
                    description: true,
                    isArchived: true
                }
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

    async duplicateList(sourceListId: string, boardId: string, title?: string): Promise<List> {
        const sourceList = await this.findListById(sourceListId)
        if (!sourceList) {
            throw new Error('Source list not found')
        }

        let pos = Config.defaultGap
        const highest = await this.getHighestPositionInBoard(boardId)
        if (highest !== null) pos = highest + Config.defaultGap

        const newList = this.repo.create({
            title: title || sourceList.title,
            position: pos,
            board: { id: boardId } as any
        })

        return await this.repo.save(newList)
    }
}

export default new ListRepository()
