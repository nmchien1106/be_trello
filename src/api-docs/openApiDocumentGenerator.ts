import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

import { authRegistry } from '@/apis/auth/auth.swagger'
import { userRegistry } from '@/apis/users/users.swagger'
import { workspaceRegister } from '@/apis/workspace/workspace.swagger'
import { boardRegistry } from '@/apis/board/board.swagger'
import { roleRegistry } from '@/apis/role/role.swagger'
import { listRegistry, listsRegisterPath } from '@/apis/list/list.swagger'
import { cardRegistry, cardsRegisterPath } from '@/apis/card/card.swagger'

export function generateOpenAPIDocument() {
    listsRegisterPath()
    cardsRegisterPath()
    const registry = new OpenAPIRegistry([userRegistry, authRegistry, roleRegistry, workspaceRegister, boardRegistry, listRegistry, cardRegistry])

    registry.registerComponent('securitySchemes', 'bearerAuth', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header'
    })

    registry.registerComponent('securitySchemes', 'cookieAuth', {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken'
    })

    const generator = new OpenApiGeneratorV3(registry.definitions)

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'Swagger API'
        },
        externalDocs: {
            description: 'View the raw OpenAPI Specification in JSON format',
            url: '/swagger.json'
        }
    })
}
