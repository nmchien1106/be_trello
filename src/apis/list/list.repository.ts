import { List } from "@/entities/list.entity";
import DataSource from "@/config/typeorm.config"

class ListRepository {
    private repository = DataSource.getRepository(List)

    findListById = async (id: string): Promise<List | null> => {
        return await this.repository.findOne({
            where: { id }
        })
    }

    updateList = async (id: string, data: Partial<List>): Promise<void> => {
        await this.repository.update({ id }, data)
    }

    getHighestPositionInBoard = async (boardId: string): Promise<number | null> => {
        const list =  await this.repository.findOne({
            where: { boardId: { id: boardId } },
            order: { position: 'DESC' }
        })
        return list ? list.position : null
    }

    duplicateList = async (sourceListId: string): Promise<List> => {
        // Create a new list entity with the provided data
        const sourceList = await this.repository.findOne({
            where: {id: sourceListId},
            relations: ['cards']
        })

        if (!sourceList) {
            throw new Error('Source list not found')
        }

        const highestPosition = await this.getHighestPositionInBoard(sourceList.boardId.id)
        const newPosition = highestPosition !== null ? highestPosition + 1 : 1

        const newList = this.repository.create({
            title: sourceList.title,
            position: newPosition,
            boardId: { id: sourceList.boardId.id }
        })

        const newCards = sourceList.cards.map(card => {
            return {
                ...card,
                id: undefined,
                list: newList
            }
        })

        newList.cards = newCards

        return await this.repository.save(newList)

    }
}


export default new ListRepository()