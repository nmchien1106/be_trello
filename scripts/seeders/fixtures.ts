import { LabelColor } from '../../src/enums/label.enum'

type UserFixture = {
    key: string
    email: string
    username: string
    fullName: string
    bio: string
    avatarUrl: string
    globalRole: 'admin' | 'user'
}

type WorkspaceFixture = {
    key: string
    title: string
    description: string
    ownerKey: string
    memberKeys: string[]
}

type BoardFixture = {
    key: string
    title: string
    description: string
    workspaceKey: string
    ownerKey: string
    permissionLevel: 'private' | 'workspace' | 'public'
    memberKeys: string[]
}

type ListFixture = {
    key: string
    title: string
    boardKey: string
    position: number
    createdByKey: string
}

type CardFixture = {
    key: string
    title: string
    description: string
    listKey: string
    position: number
    priority: 'low' | 'medium' | 'high'
    dueInDays: number
    createdByKey: string
    assigneeKeys: string[]
}

type ChecklistFixture = {
    key: string
    title: string
    cardKey: string
    items: Array<{ content: string; isChecked: boolean; position: number }>
}

type LabelFixture = {
    key: string
    boardKey: string
    name: string
    color: LabelColor
    cardKeys: string[]
}

export const TEST_PASSWORD = 'Test@123456'

export const userFixtures: UserFixture[] = [
    {
        key: 'admin',
        email: 'lan.admin@trellotest.dev',
        username: 'lanadmin',
        fullName: 'Nguyen Lan',
        bio: 'System admin for integration tests.',
        avatarUrl: 'https://i.pravatar.cc/300?img=11',
        globalRole: 'admin'
    },
    {
        key: 'pm',
        email: 'anh.pm@trellotest.dev',
        username: 'anhpm',
        fullName: 'Tran Anh',
        bio: 'Product manager for growth team.',
        avatarUrl: 'https://i.pravatar.cc/300?img=32',
        globalRole: 'user'
    },
    {
        key: 'frontend',
        email: 'linh.frontend@trellotest.dev',
        username: 'linhfe',
        fullName: 'Pham Linh',
        bio: 'Frontend engineer focused on UX.',
        avatarUrl: 'https://i.pravatar.cc/300?img=24',
        globalRole: 'user'
    },
    {
        key: 'backend',
        email: 'khoa.backend@trellotest.dev',
        username: 'khoabe',
        fullName: 'Le Khoa',
        bio: 'Backend engineer focused on APIs.',
        avatarUrl: 'https://i.pravatar.cc/300?img=14',
        globalRole: 'user'
    },
    {
        key: 'designer',
        email: 'mai.design@trellotest.dev',
        username: 'maidesign',
        fullName: 'Vo Mai',
        bio: 'Product designer for mobile web.',
        avatarUrl: 'https://i.pravatar.cc/300?img=47',
        globalRole: 'user'
    },
    {
        key: 'qa',
        email: 'hung.qa@trellotest.dev',
        username: 'hungqa',
        fullName: 'Dang Hung',
        bio: 'QA engineer owning regression tests.',
        avatarUrl: 'https://i.pravatar.cc/300?img=52',
        globalRole: 'user'
    },
    {
        key: 'marketing',
        email: 'thao.marketing@trellotest.dev',
        username: 'thaomkt',
        fullName: 'Bui Thao',
        bio: 'Marketing specialist for campaigns.',
        avatarUrl: 'https://i.pravatar.cc/300?img=60',
        globalRole: 'user'
    },
    {
        key: 'analyst',
        email: 'viet.analyst@trellotest.dev',
        username: 'vietdata',
        fullName: 'Do Viet',
        bio: 'Data analyst building product insights.',
        avatarUrl: 'https://i.pravatar.cc/300?img=18',
        globalRole: 'user'
    }
]

export const workspaceFixtures: WorkspaceFixture[] = [
    {
        key: 'engineering',
        title: 'Engineering Workspace',
        description: 'Product engineering planning and delivery.',
        ownerKey: 'pm',
        memberKeys: ['frontend', 'backend', 'qa', 'designer']
    },
    {
        key: 'marketing',
        title: 'Marketing Workspace',
        description: 'Campaign planning and content calendar.',
        ownerKey: 'marketing',
        memberKeys: ['designer', 'analyst', 'pm']
    },
    {
        key: 'growth',
        title: 'Growth Experiments',
        description: 'A/B tests and funnel experiments.',
        ownerKey: 'analyst',
        memberKeys: ['pm', 'marketing', 'frontend']
    },
    {
        key: 'mobile',
        title: 'Mobile Roadmap',
        description: 'Mobile features and release cadence.',
        ownerKey: 'frontend',
        memberKeys: ['backend', 'designer', 'qa']
    },
    {
        key: 'ops',
        title: 'Operations Hub',
        description: 'Infra reliability and incident management.',
        ownerKey: 'backend',
        memberKeys: ['qa', 'admin']
    },
    {
        key: 'customer-success',
        title: 'Customer Success',
        description: 'Onboarding, support and retention workflow.',
        ownerKey: 'pm',
        memberKeys: ['marketing', 'analyst', 'qa']
    }
]

export const boardFixtures: BoardFixture[] = [
    {
        key: 'eng-sprint',
        title: 'Sprint 24 - Core Platform',
        description: 'Stories and bugs for sprint 24.',
        workspaceKey: 'engineering',
        ownerKey: 'pm',
        permissionLevel: 'workspace',
        memberKeys: ['frontend', 'backend', 'qa']
    },
    {
        key: 'eng-techdebt',
        title: 'Tech Debt Cleanup',
        description: 'Prioritized debt and refactor tasks.',
        workspaceKey: 'engineering',
        ownerKey: 'backend',
        permissionLevel: 'workspace',
        memberKeys: ['frontend', 'qa']
    },
    {
        key: 'mkt-q3',
        title: 'Q3 Campaign Launch',
        description: 'Execution board for Q3 campaign.',
        workspaceKey: 'marketing',
        ownerKey: 'marketing',
        permissionLevel: 'public',
        memberKeys: ['designer', 'analyst', 'pm']
    },
    {
        key: 'growth-funnel',
        title: 'Funnel Optimization',
        description: 'Conversion rate improvement initiatives.',
        workspaceKey: 'growth',
        ownerKey: 'analyst',
        permissionLevel: 'workspace',
        memberKeys: ['pm', 'marketing', 'frontend']
    },
    {
        key: 'mobile-release',
        title: 'Mobile Release Train',
        description: 'Track features for next mobile release.',
        workspaceKey: 'mobile',
        ownerKey: 'frontend',
        permissionLevel: 'workspace',
        memberKeys: ['backend', 'designer', 'qa']
    },
    {
        key: 'ops-oncall',
        title: 'On-call Rotation',
        description: 'Incidents, postmortems and runbook updates.',
        workspaceKey: 'ops',
        ownerKey: 'backend',
        permissionLevel: 'private',
        memberKeys: ['qa', 'admin']
    },
    {
        key: 'cs-onboarding',
        title: 'Customer Onboarding',
        description: 'Playbook for new customer onboarding.',
        workspaceKey: 'customer-success',
        ownerKey: 'pm',
        permissionLevel: 'workspace',
        memberKeys: ['marketing', 'analyst']
    },
    {
        key: 'cs-feedback',
        title: 'Voice Of Customer',
        description: 'Feedback triage and product follow-up.',
        workspaceKey: 'customer-success',
        ownerKey: 'analyst',
        permissionLevel: 'workspace',
        memberKeys: ['pm', 'qa', 'marketing']
    }
]

export const listFixtures: ListFixture[] = [
    { key: 'l1', title: 'Backlog', boardKey: 'eng-sprint', position: 1000, createdByKey: 'pm' },
    { key: 'l2', title: 'In Progress', boardKey: 'eng-sprint', position: 2000, createdByKey: 'frontend' },
    { key: 'l3', title: 'Review', boardKey: 'eng-sprint', position: 3000, createdByKey: 'backend' },
    { key: 'l4', title: 'Done', boardKey: 'eng-sprint', position: 4000, createdByKey: 'qa' },
    { key: 'l5', title: 'Ideas', boardKey: 'mkt-q3', position: 1000, createdByKey: 'marketing' },
    { key: 'l6', title: 'Planned', boardKey: 'mkt-q3', position: 2000, createdByKey: 'marketing' },
    { key: 'l7', title: 'Running', boardKey: 'mkt-q3', position: 3000, createdByKey: 'designer' },
    { key: 'l8', title: 'Analyze', boardKey: 'growth-funnel', position: 1000, createdByKey: 'analyst' },
    { key: 'l9', title: 'Experimenting', boardKey: 'growth-funnel', position: 2000, createdByKey: 'pm' },
    { key: 'l10', title: 'Shipped', boardKey: 'growth-funnel', position: 3000, createdByKey: 'frontend' }
]

export const cardFixtures: CardFixture[] = [
    {
        key: 'c1',
        title: 'Implement SSO Login',
        description: 'Add Google and Microsoft SSO providers.',
        listKey: 'l2',
        position: 1000,
        priority: 'high',
        dueInDays: 5,
        createdByKey: 'pm',
        assigneeKeys: ['frontend', 'backend']
    },
    {
        key: 'c2',
        title: 'Fix Board Drag Performance',
        description: 'Reduce re-renders in card drag-and-drop.',
        listKey: 'l2',
        position: 2000,
        priority: 'medium',
        dueInDays: 4,
        createdByKey: 'frontend',
        assigneeKeys: ['frontend']
    },
    {
        key: 'c3',
        title: 'Add Audit Log Endpoint',
        description: 'Expose workspace audit logs for admin.',
        listKey: 'l1',
        position: 1000,
        priority: 'high',
        dueInDays: 7,
        createdByKey: 'backend',
        assigneeKeys: ['backend', 'qa']
    },
    {
        key: 'c4',
        title: 'Regression Test Suite',
        description: 'Cover auth, board and card critical flows.',
        listKey: 'l3',
        position: 1000,
        priority: 'medium',
        dueInDays: 3,
        createdByKey: 'qa',
        assigneeKeys: ['qa']
    },
    {
        key: 'c5',
        title: 'Campaign Landing Copy',
        description: 'Finalize ad copy and CTA variants.',
        listKey: 'l6',
        position: 1000,
        priority: 'medium',
        dueInDays: 6,
        createdByKey: 'marketing',
        assigneeKeys: ['designer', 'marketing']
    },
    {
        key: 'c6',
        title: 'Design Banner Variations',
        description: 'Prepare three hero creatives for testing.',
        listKey: 'l7',
        position: 1000,
        priority: 'low',
        dueInDays: 2,
        createdByKey: 'designer',
        assigneeKeys: ['designer']
    },
    {
        key: 'c7',
        title: 'Build Pricing A/B Test',
        description: 'Experiment with annual discount highlight.',
        listKey: 'l9',
        position: 1000,
        priority: 'high',
        dueInDays: 8,
        createdByKey: 'analyst',
        assigneeKeys: ['frontend', 'analyst']
    },
    {
        key: 'c8',
        title: 'Track Activation Events',
        description: 'Add instrumentation for first value event.',
        listKey: 'l8',
        position: 1000,
        priority: 'medium',
        dueInDays: 9,
        createdByKey: 'analyst',
        assigneeKeys: ['backend', 'analyst']
    },
    {
        key: 'c9',
        title: 'Mobile Push Notification',
        description: 'Ship push reminders for due cards.',
        listKey: 'l10',
        position: 1000,
        priority: 'medium',
        dueInDays: 10,
        createdByKey: 'frontend',
        assigneeKeys: ['frontend', 'backend', 'qa']
    },
    {
        key: 'c10',
        title: 'Customer Onboarding Checklist',
        description: 'Document setup steps for new accounts.',
        listKey: 'l5',
        position: 1000,
        priority: 'low',
        dueInDays: 5,
        createdByKey: 'pm',
        assigneeKeys: ['marketing', 'analyst']
    }
]

export const checklistFixtures: ChecklistFixture[] = [
    {
        key: 'chk1',
        title: 'SSO Readiness',
        cardKey: 'c1',
        items: [
            { content: 'Create OAuth app in Google Cloud', isChecked: true, position: 1000 },
            { content: 'Configure callback URL', isChecked: true, position: 2000 },
            { content: 'Write fallback login flow', isChecked: false, position: 3000 }
        ]
    },
    {
        key: 'chk2',
        title: 'Performance Validation',
        cardKey: 'c2',
        items: [
            { content: 'Measure FPS while dragging 100 cards', isChecked: false, position: 1000 },
            { content: 'Profile React render flamegraph', isChecked: false, position: 2000 }
        ]
    },
    {
        key: 'chk3',
        title: 'Audit API',
        cardKey: 'c3',
        items: [
            { content: 'Define pagination params', isChecked: true, position: 1000 },
            { content: 'Add role-based filtering', isChecked: false, position: 2000 }
        ]
    },
    {
        key: 'chk4',
        title: 'Regression Scope',
        cardKey: 'c4',
        items: [
            { content: 'Prepare test data', isChecked: true, position: 1000 },
            { content: 'Run smoke tests in staging', isChecked: false, position: 2000 }
        ]
    },
    {
        key: 'chk5',
        title: 'Landing Copy',
        cardKey: 'c5',
        items: [
            { content: 'Finalize value proposition', isChecked: true, position: 1000 },
            { content: 'Approve CTA wording', isChecked: false, position: 2000 }
        ]
    },
    {
        key: 'chk6',
        title: 'Experiment Setup',
        cardKey: 'c7',
        items: [
            { content: 'Define success metric', isChecked: true, position: 1000 },
            { content: 'Configure split traffic', isChecked: false, position: 2000 }
        ]
    },
    {
        key: 'chk7',
        title: 'Analytics Events',
        cardKey: 'c8',
        items: [
            { content: 'Track signup_completed', isChecked: true, position: 1000 },
            { content: 'Track first_board_created', isChecked: false, position: 2000 }
        ]
    },
    {
        key: 'chk8',
        title: 'Onboarding Guide',
        cardKey: 'c10',
        items: [
            { content: 'Write setup article', isChecked: false, position: 1000 },
            { content: 'Record 2-minute demo video', isChecked: false, position: 2000 }
        ]
    }
]

export const labelFixtures: LabelFixture[] = [
    { key: 'lb1', boardKey: 'eng-sprint', name: 'Backend', color: LabelColor.BLUE, cardKeys: ['c1', 'c3', 'c8'] },
    { key: 'lb2', boardKey: 'eng-sprint', name: 'Frontend', color: LabelColor.GREEN, cardKeys: ['c1', 'c2', 'c9'] },
    { key: 'lb3', boardKey: 'eng-sprint', name: 'Urgent', color: LabelColor.RED, cardKeys: ['c1', 'c3'] },
    { key: 'lb4', boardKey: 'eng-sprint', name: 'QA Needed', color: LabelColor.YELLOW, cardKeys: ['c2', 'c4'] },
    { key: 'lb5', boardKey: 'mkt-q3', name: 'Campaign', color: LabelColor.ORANGE, cardKeys: ['c5', 'c10'] },
    { key: 'lb6', boardKey: 'mkt-q3', name: 'Creative', color: LabelColor.PURPLE, cardKeys: ['c5', 'c6'] },
    { key: 'lb7', boardKey: 'growth-funnel', name: 'Experiment', color: LabelColor.BLUE, cardKeys: ['c7', 'c8'] },
    { key: 'lb8', boardKey: 'growth-funnel', name: 'Analytics', color: LabelColor.GREEN, cardKeys: ['c7', 'c8'] },
    { key: 'lb9', boardKey: 'growth-funnel', name: 'High Impact', color: LabelColor.RED, cardKeys: ['c7'] },
    { key: 'lb10', boardKey: 'mkt-q3', name: 'Low Priority', color: LabelColor.YELLOW, cardKeys: ['c6'] }
]

export const userFixtureByKey = Object.fromEntries(userFixtures.map((item) => [item.key, item]))
export const workspaceFixtureByKey = Object.fromEntries(workspaceFixtures.map((item) => [item.key, item]))
export const boardFixtureByKey = Object.fromEntries(boardFixtures.map((item) => [item.key, item]))
export const listFixtureByKey = Object.fromEntries(listFixtures.map((item) => [item.key, item]))
export const cardFixtureByKey = Object.fromEntries(cardFixtures.map((item) => [item.key, item]))
