import { OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Column, Entity } from 'typeorm'
import { DateTimeEntity } from './base/DateTimeEntity'
import { CardLabel } from './card-label.entity'
import { LabelColor } from '../enums/label.enum'
import { ManyToOne } from 'typeorm'
import { Board } from '@/entities/board.entity'

@Entity('labels')
export class Label extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'enum', enum: LabelColor })
    color: LabelColor

    @Column({ type: 'varchar', length: 100, nullable: true })
    name: string

    @ManyToOne(() => Board, (board) => board.labels, { onDelete: 'CASCADE' })
    board: Board

    @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label)
    cardLabels: CardLabel[]
}
