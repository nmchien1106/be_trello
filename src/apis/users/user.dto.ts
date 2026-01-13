export class UserDTOForRelation {
    id: string
    username: string
    avatarUrl: string | null

    constructor(user: { id: string; username: string}) {
        this.id = user.id
        this.username = user.username
    }
}

export class UserDTO {
    id: string
    username: string
    email: string
    roles: string[]
    createdAt: Date
    updatedAt: Date
    constructor(user: any) {
        this.id = user.id
        this.username = user.username
        this.email = user.email
        this.roles = user.roles ? user.roles.map((role: any) => role.name) : []
        this.createdAt = user.createdAt
        this.updatedAt = user.updatedAt
    }
}
