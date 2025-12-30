import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Board } from './board.entity'
import { User } from './user.entity'
import { Role } from './role.entity'

@Entity('board_members')
@Unique(['board', 'user'])
export class BoardMembers extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @ManyToOne(() => Role, (role) => role.boardMembers)
    public role: Role

    @ManyToOne(() => Board, (board) => board.boardMembers)
    board: Board

    @ManyToOne(() => User, (user) => user.boardMembers)
    user: User
}
