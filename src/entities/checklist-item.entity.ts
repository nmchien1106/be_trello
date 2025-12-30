import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { DateTimeEntity } from './base/DateTimeEntity'
import { Checklist } from './checklist.entity'

@Entity('checklist_items')
export class ChecklistItem extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    public content: string

    @Column({ type: 'boolean', default: false })
    public isChecked: boolean

    @Column({ type: 'int', default: 0 })
    public position: number

    @ManyToOne(() => Checklist, (checklist) => checklist.items, { onDelete: 'CASCADE' })
    public checklist: Checklist
}