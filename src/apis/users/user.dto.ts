export class UserDTOForRelation {
    id: string
    name: string
    email: string
    constructor(partial: Partial<UserDTOForRelation>) {
        Object.assign(this, partial)
    }
}

export class UserDTO {
    id: string
    name: string
    email: string
    roles: string[]
    createdAt: Date
    updatedAt: Date
    constructor(user: any) {
        this.id = user.id
        this.name = user.name
        this.email = user.email
        this.roles = user.roles ? user.roles.map((role: any) => role.name) : []
        this.createdAt = user.createdAt
        this.updatedAt = user.updatedAt
    }
}