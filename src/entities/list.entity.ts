import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Board } from './board.entity'
import { Card } from './card.entity'

@Entity('lists')
export class List extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    title: string

    @Column({ type: 'int', default: 0 })
    position: number

    @ManyToOne(() => Board, (board) => board.lists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'boardId' })
    public board: Board

    @OneToMany(() => Card, (card) => card.list)
    cards: Card[]
}
