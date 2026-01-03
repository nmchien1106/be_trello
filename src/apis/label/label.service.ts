import AppDataSource from '@/config/typeorm.config'
import { Card } from '@/entities/card.entity'
import { Label } from '@/entities/label.entity'
import { CardLabel } from '@/entities/card-label.entity'
import { LabelColor } from '@/enums/label.enum'

const labelRepository = AppDataSource.getRepository(Label)
const cardLabelRepo = AppDataSource.getRepository(CardLabel)
const cardRepo = AppDataSource.getRepository(Card)

class LabelService {
  async createLabel(cardId: string, color: LabelColor, name?: string) {

    const card = await cardRepo.findOne({
      where: { id: cardId },
      relations: {
        list: {
          board: true
        }
      }
    })

    if (!card) {
      throw new Error('Card not found')
    }

    const board = card.list.board

    const existed = await labelRepository.findOne({
      where: {
        board: { id: board.id },
        color,
        name: name ?? null
      }
    })

    if (existed) {
      throw new Error('Label color already exists in this board')
    }

    const label = labelRepository.create({
      color,
      name: name ?? undefined,
      board
    })

    const savedLabel = await labelRepository.save(label)

    await cardLabelRepo.save({
      card: { id: card.id },
      label: { id: savedLabel.id }
    })

    return {
      id: savedLabel.id,
      name: savedLabel.name,
      color: savedLabel.color,
      createdAt: savedLabel.createdAt,
      updatedAt: savedLabel.updatedAt
    }
  }
}

export default new LabelService()
