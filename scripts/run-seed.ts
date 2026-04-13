import 'reflect-metadata'

import { DataSource } from 'typeorm'

import AppDataSource from '../src/config/typeorm.config'
import { seedBoards } from './seeders/seed-board'
import { seedCards } from './seeders/seed-card'
import { seedChecklists } from './seeders/seed-checklist'
import { seedLabels } from './seeders/seed-label'
import { seedLists } from './seeders/seed-list'
import { seedRolesAndPermissions } from './seeders/seed-role-permission'
import { seedUsers } from './seeders/seed-user'
import { seedWorkspaces } from './seeders/seed-workspace'

type SeedTarget = 'role' | 'user' | 'auth' | 'workspace' | 'board' | 'list' | 'card' | 'checklist' | 'label' | 'all'

type Seeder = {
    key: Exclude<SeedTarget, 'auth' | 'all'>
    run: (dataSource: DataSource) => Promise<void>
}

const orderedSeeders: Seeder[] = [
    { key: 'role', run: seedRolesAndPermissions },
    { key: 'user', run: seedUsers },
    { key: 'workspace', run: seedWorkspaces },
    { key: 'board', run: seedBoards },
    { key: 'list', run: seedLists },
    { key: 'card', run: seedCards },
    { key: 'checklist', run: seedChecklists },
    { key: 'label', run: seedLabels }
]

const chainByTarget: Record<SeedTarget, Seeder['key'][]> = {
    role: ['role'],
    user: ['role', 'user'],
    auth: ['role', 'user'],
    workspace: ['role', 'user', 'workspace'],
    board: ['role', 'user', 'workspace', 'board'],
    list: ['role', 'user', 'workspace', 'board', 'list'],
    card: ['role', 'user', 'workspace', 'board', 'list', 'card'],
    checklist: ['role', 'user', 'workspace', 'board', 'list', 'card', 'checklist'],
    label: ['role', 'user', 'workspace', 'board', 'list', 'card', 'label'],
    all: ['role', 'user', 'workspace', 'board', 'list', 'card', 'checklist', 'label']
}

async function runSeed(target: SeedTarget): Promise<void> {
    const dataSource: DataSource = await AppDataSource.initialize()

    try {
        const plannedKeys = chainByTarget[target]
        const seedersToRun = orderedSeeders.filter((item) => plannedKeys.includes(item.key))

        for (const seeder of seedersToRun) {
            console.log(`\n===> Running seeder: ${seeder.key}`)
            await seeder.run(dataSource)
        }

        console.log(`\nSeeding completed for target: ${target}`)
    } finally {
        await dataSource.destroy()
    }
}

function parseTargetFromCli(): SeedTarget {
    const input = (process.argv[2] || 'all') as SeedTarget
    const validTargets: SeedTarget[] = [
        'role',
        'user',
        'auth',
        'workspace',
        'board',
        'list',
        'card',
        'checklist',
        'label',
        'all'
    ]

    if (!validTargets.includes(input)) {
        throw new Error(`Invalid seed target "${input}". Supported: ${validTargets.join(', ')}`)
    }

    return input
}

runSeed(parseTargetFromCli()).catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
})
