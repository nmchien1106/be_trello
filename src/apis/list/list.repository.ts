import { List } from '@/entities/list.entity'
import DataSource from '@/config/typeorm.config'
import { Config } from '@/config/config'

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
        const list = await this.repository.findOne({
            where: { boardId },
            order: { position: 'DESC' }
        })
        return list ? list.position : null
    }

    duplicateList = async (sourceListId: string, boardId: string, title: string): Promise<List> => {
        const sourceList = await this.findListById(sourceListId)
        if (!sourceList) {
            throw new Error('Source list not found')
        }


        let pos = Config.defaultGap
        const highestListPosition = await this.getHighestPositionInBoard(boardId)
        if (highestListPosition !== null) {
            pos = highestListPosition + Config.defaultGap
        }

        const newList = this.repository.create({
            title: title || sourceList.title,
            position: pos,
            boardId : sourceList.boardId
        })
        return await this.repository.save(newList)
    }
}

export default new ListRepository()
