import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Card } from './card.entity'
import { Label } from './label.entity'

@Entity('card_labels')
export class CardLabel{
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Card, (card) => card.cardLabels, { onDelete: 'CASCADE' })
    card: Card

    @ManyToOne(() => Label, (label) => label.cardLabels, { onDelete: 'CASCADE' })
    label: Label
}