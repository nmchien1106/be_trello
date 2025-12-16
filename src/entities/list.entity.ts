import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Board } from './board.entity'
import { Card } from './card.entity'
import { User } from './user.entity'

@Entity('lists')
export class List extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    title: string

    @Column({ type: 'int', default: 0 })
    position: number

    @Column({ type: 'uuid' })
    boardId: string

    @ManyToOne(() => Board, (board) => board.lists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'boardId' })
    board: Board

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    public createdBy?: User

    @OneToMany(() => Card, (card) => card.list)
    cards: Card[]

    @Column({ type: 'boolean', default: false })
    public isArchived: boolean
}
