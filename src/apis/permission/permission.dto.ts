import { Permission } from "@/entities/permission.entity"

export class PermissionDTOForRelation {
    id: string
    name: string
    constructor(id: string, name: string) {
        this.id = id
        this.name = name
    }
}
export class PermissionDTO {
    id: string
    name: string
    description: string
    createdAt: Date
    updatedAt: Date
    constructor(permission: Permission) {
        this.id = permission.id
        this.name = permission.name
        this.description = permission.description
        this.createdAt = permission.createdAt
        this.updatedAt = permission.updatedAt
    }
}