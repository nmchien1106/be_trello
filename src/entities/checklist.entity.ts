import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { DateTimeEntity } from './base/DateTimeEntity'
import { Card } from './card.entity'
import { ChecklistItem } from './checklist-item.entity'

@Entity('checklists')
export class Checklist extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    public title: string

    @ManyToOne(() => Card, (card) => card.checklists, { onDelete: 'CASCADE' })
    public card: Card

    @OneToMany(() => ChecklistItem, (item) => item.checklist)
    public items: ChecklistItem[]
}