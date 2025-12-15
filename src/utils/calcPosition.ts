import DataSource from '@/config/typeorm.config'
import { Config } from '@/config/config'
import { List } from '@/entities/list.entity'

export async function calcPosition(beforePosition: number | null, afterPosition: number | null, boardId: string): Promise<number> {
    let newPosition: number = Config.defaultGap

    if (beforePosition === null && afterPosition !== null) {
        newPosition = afterPosition / 2
    }

    if (beforePosition !== null && afterPosition === null) {
        newPosition = beforePosition + Config.defaultGap
    }

    if (beforePosition !== null && afterPosition !== null) {
        const gap = afterPosition - beforePosition
        if (gap <= 10){
            await rebanlancePositions(boardId)
            return calcPosition(beforePosition, afterPosition, boardId)
        }
        newPosition = (beforePosition + afterPosition) / 2
    }

    return newPosition
}

export async function rebanlancePositions(boardId: string) {
    return await DataSource.transaction(async (manager) => {
        const lists = await manager.find(List, {
            where: { boardId: {id: boardId} },
            order: { position: 'ASC' },

        })

        for (let i = 0; i < lists.length; i++) {
            await manager.update(
                List,
                {
                    id: lists[i].id
                },
                { position: (i + 1) * Config.defaultGap }
            )
        }
    })
}
