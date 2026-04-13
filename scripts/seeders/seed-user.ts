import bcrypt from 'bcryptjs'
import { DataSource } from 'typeorm'

import { Role } from '../../src/entities/role.entity'
import { User } from '../../src/entities/user.entity'
import { TEST_PASSWORD, userFixtures } from './fixtures'

export async function seedUsers(dataSource: DataSource): Promise<void> {
    const userRepo = dataSource.getRepository(User)
    const roleRepo = dataSource.getRepository(Role)

    const adminRole = await roleRepo.findOne({ where: { name: 'admin' } })
    const userRole = await roleRepo.findOne({ where: { name: 'user' } })

    if (!adminRole || !userRole) {
        throw new Error('Missing base roles. Run role seeder first.')
    }

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10)

    for (const fixture of userFixtures) {
        const assignedRole = fixture.globalRole === 'admin' ? adminRole : userRole
        const existedUser = await userRepo.findOne({ where: { email: fixture.email }, relations: ['roles'] })

        if (!existedUser) {
            const user = userRepo.create({
                email: fixture.email,
                password: hashedPassword,
                username: fixture.username,
                fullName: fixture.fullName,
                bio: fixture.bio,
                avatarUrl: fixture.avatarUrl,
                isActive: true,
                roles: [assignedRole]
            })
            await userRepo.save(user)
            console.log(`Created user: ${fixture.email}`)
            continue
        }

        existedUser.username = fixture.username
        existedUser.fullName = fixture.fullName
        existedUser.bio = fixture.bio
        existedUser.avatarUrl = fixture.avatarUrl
        existedUser.isActive = true
        existedUser.roles = [assignedRole]
        existedUser.password = hashedPassword

        await userRepo.save(existedUser)
        console.log(`Updated user: ${fixture.email}`)
    }

    console.log(`Seeded users successfully. Test password: ${TEST_PASSWORD}`)
}
