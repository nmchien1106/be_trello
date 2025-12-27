import AppDataSource from '@/config/typeorm.config'
import { Board } from '@/entities/board.entity'
import { List } from '@/entities/list.entity'
import { Card } from '@/entities/card.entity'
type ResourceType = 'BOARD' | 'LIST' | 'CARD'

export const getBoardIdFromResource = async (
    resourceType: ResourceType,
    resourceId: string
): Promise<string | null> => {
    const boardRepo = AppDataSource.getRepository(Board)
    const listRepo = AppDataSource.getRepository(List)
    const cardRepo = AppDataSource.getRepository(Card)

    switch (resourceType) {
        case 'BOARD': {
            const board = await boardRepo.findOne({ where: { id: resourceId } })
            return board?.id ?? null
        }

        case 'LIST': {
            const list = await listRepo.findOne({
                where: { id: resourceId },
                relations: ['board']
            })
            return list?.board?.id ?? null
        }

        case 'CARD': {
            const card = await cardRepo.findOne({
                where: { id: resourceId },
                relations: ['list', 'list.board']
            })
            return card?.list?.board?.id ?? null
        }

        default:
            return null
    }
}
