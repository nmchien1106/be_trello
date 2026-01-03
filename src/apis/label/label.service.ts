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
                name: name ?? undefined
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

    async updateLabel(labelId: string, color?: LabelColor, name?: string) {
        const label = await labelRepository.findOne({ where: { id: labelId }, relations: { board: true } })

        if (!label) {
            throw new Error('Label not found')
        }

        const newColor = color ?? label.color
        const newName = name ?? label.name

        const existed = await labelRepository.findOne({
            where: {
                board: { id: label.board.id },
                color: newColor,
                name: newName
            }
        })

        if (existed && existed.id !== label.id) {
            throw new Error('Label with same color and name already exists')
        }

        label.color = newColor
        label.name = newName

        const savedLabel = await labelRepository.save(label)

        return {
            id: savedLabel.id,
            name: savedLabel.name,
            color: savedLabel.color,
            createdAt: savedLabel.createdAt,
            updateAt: savedLabel.updatedAt
        }
    }

    async getAllLabelsOnCard(cardId: string) {
        const card = await cardRepo.findOne({ where: { id: cardId }})

        if (!card) {
          throw new Error('Card not found')
        }

        const cardLabels = await cardLabelRepo.find({
          where: { card: { id: cardId }},
          relations: { label: true },
        })

        return cardLabels.map(cl => ({
          id: cl.label.id,
          name: cl.label.name,
          color: cl.label.color,
          createdAt: cl.label.createdAt,
          updatedAt: cl.label.updatedAt
        }))
    }

    async getLabel(labelId: string){
        const label = await labelRepository.findOne({ where: { id: labelId } })

        if (!label) {
            throw new Error('Label not found')
        }
        return {
            id: label.id,
            name: label.name,
            color: label.color,
            createdAt: label.createdAt,
            updatedAt: label.updatedAt
        }
    }
}

export default new LabelService()
