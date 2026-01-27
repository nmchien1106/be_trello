import { User } from '@/entities/user.entity'
import AppDataSource from '@/config/typeorm.config'
import { Role } from '@/entities/role.entity'

class UserRepository {
    private repo = AppDataSource.getRepository(User)

    findAll = async (): Promise<User[]> => {
        return this.repo.find()
    }

    findById = async (id: string): Promise<User | null> => {
        return this.repo.findOne({
            where: { id }
        })
    }

    createUser = async (data: Partial<User>): Promise<User> => {
        const roleRepo = AppDataSource.getRepository(Role)

        const defaultRole = await roleRepo.findOneBy({ name: 'user' })
        if (!defaultRole) {
            throw new Error('Default role not found')
        }
        const user = this.repo.create({
            ...data,
            role: [defaultRole]
        })
        user.isActive = true
        return this.repo.save(user)
    }

    updateUser = async (id: string, data: Partial<User>): Promise<User | null> => {
        await this.repo.update(id, data)
        return this.findById(id)
    }

    deleteUser = async (id: string): Promise<void> => {
        await this.repo.delete(id)
    }
    findByEmailAsync = async (email: string | undefined): Promise<User | null> => {
        return this.repo.findOneBy({ email })
    }
    findUserBy = async (query: Partial<User>) => {
        return this.repo.findOne({ where: query, relations: ['role'] })
    }

    updateAvatar = async (id: string, avatarUrl: string): Promise<User | null> => {
        await this.repo.update(id, { avatarUrl: avatarUrl })
        return this.findById(id)
    }
}

export default new UserRepository()
