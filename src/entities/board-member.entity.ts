import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'

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
    @JoinColumn({ name: 'roleId' })
    public role: Role

    @ManyToOne(() => Board, (board) => board.boardMembers)
    @JoinColumn({ name: 'boardId' })
    board: Board

    @ManyToOne(() => User, (user) => user.boardMembers)
    @JoinColumn({ name: 'userId' })
    user: User
}
