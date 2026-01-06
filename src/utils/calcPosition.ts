import DataSource from '@/config/typeorm.config'
import { Config } from '@/config/config'
import { List } from '@/entities/list.entity'
import { Card } from '@/entities/card.entity'

type ResourceType = 'list' | 'card'

export async function calcPosition(
    beforePosition: number | null, 
    afterPosition: number | null, 
    contextId: string,
    type: ResourceType = 'list'
): Promise<number> {
    let newPosition: number = Config.defaultGap

    if (beforePosition === null && afterPosition !== null) {
        newPosition = afterPosition / 2
    }

    if (beforePosition !== null && afterPosition === null) {
        newPosition = beforePosition + Config.defaultGap
    }

    if (beforePosition !== null && afterPosition !== null) {
        const gap = afterPosition - beforePosition
        
        if (gap <= 1) {
            if (type === 'list') {
                await rebalanceListPositions(contextId) // contextId ở đây là boardId
            } else {
                await rebalanceCardPositions(contextId) // contextId ở đây là listId
            }
            return calcPosition(beforePosition, afterPosition, contextId, type)
        }
        
        newPosition = (beforePosition + afterPosition) / 2
    }

    return newPosition
}

export async function rebalanceListPositions(boardId: string) {
    return await DataSource.transaction(async (manager) => {
        const lists = await manager.find(List, {
            where: { board: { id: boardId } },
            order: { position: 'ASC' },
        })

        for (let i = 0; i < lists.length; i++) {
            await manager.update(List, lists[i].id, { 
                position: (i + 1) * Config.defaultGap 
            })
        }
    })
}


export async function rebalanceCardPositions(listId: string) {
    return await DataSource.transaction(async (manager) => {
        const cards = await manager.find(Card, {
            where: { list: { id: listId } },
            order: { position: 'ASC' },
        })

        for (let i = 0; i < cards.length; i++) {
            await manager.update(Card, cards[i].id, { 
                position: (i + 1) * Config.defaultGap 
            })
        }
    })
}

export async function rebanlancePositions(boardId: string) {
    return rebalanceListPositions(boardId);
}