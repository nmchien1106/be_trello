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
    const before = (beforePosition !== null && !isNaN(beforePosition)) ? beforePosition : null
    const after = (afterPosition !== null && !isNaN(afterPosition)) ? afterPosition : null

    if (before === null && after === null) {
        return Config.defaultGap
    }

    if (before === null && after !== null) {
        newPosition = after / 2
    }

    if (before !== null && after === null) {
        newPosition = before + Config.defaultGap
    }

    if (before !== null && after !== null) {
        const gap = after - before

        if (gap <= 1) { // Thắt chặt hơn để tránh số lẻ quá nhỏ
            if (type === 'list') {
                await rebalanceListPositions(contextId)
            } else {
                await rebalanceCardPositions(contextId)
            }
            return calcPosition(before, after, contextId, type)
        }

        newPosition = (before + after) / 2
    }

    if (isNaN(newPosition)) return Config.defaultGap

    return newPosition
}

export async function rebalanceListPositions(boardId: string) {
    return await DataSource.transaction(async (manager) => {
        const lists = await manager.find(List, {
            where: { board: { id: boardId }, isArchived: false },
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