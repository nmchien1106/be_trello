import { Response } from 'express'
import { Notification } from '@/entities/notification.entity'

class NotificationSSEService {
    private connections: Map<string, Response[]> = new Map()

    private heartbeats: Map<string, NodeJS.Timeout> = new Map()

    addConnection(userId: string, res: Response) {
        const userConnections = this.connections.get(userId) || []
        userConnections.push(res)
        this.connections.set(userId, userConnections)

        this.startHeartbeat(userId)

        res.on('close', () => {
            this.removeConnection(userId, res)
        })
    }

    removeConnection(userId: string, res: Response) {
        const userConnections = this.connections.get(userId) || []
        const filtered = userConnections.filter((conn) => conn !== res)

        if (filtered.length === 0) {
            this.connections.delete(userId)
            this.stopHeartbeat(userId)
        } else {
            this.connections.set(userId, filtered)
        }
    }

    sendToUser(userId: string, notification: Notification) {
        const userConnections = this.connections.get(userId)

        if (!userConnections || userConnections.length === 0) {
            return
        }

        const data = JSON.stringify(notification)
        const message = `event: notification\ndata: ${data}\nid: ${notification.id}\n\n`

        userConnections.forEach((res) => {
            try {
                res.write(message)
            } catch (error) {
                this.removeConnection(userId, res)
            }
        })
    }

    async sendToBoard(boardId: string, notification: Notification, boardService: any) {
        const members = await boardService.getBoardMembers(boardId)

        members.forEach((member) => {
            this.sendToUser(member.userId, notification)
        })
    }

    private startHeartbeat(userId: string) {
        this.stopHeartbeat(userId)

        const interval = setInterval(() => {
            const userConnections = this.connections.get(userId)
            if (!userConnections || userConnections.length === 0) {
                this.stopHeartbeat(userId)
                return
            }

            const heartbeatMessage = `event: heartbeat\ndata: ${Date.now()}\n\n`

            userConnections.forEach((res) => {
                try {
                    res.write(heartbeatMessage)
                } catch (error) {
                    this.removeConnection(userId, res)
                }
            })
        }, 30000)

        this.heartbeats.set(userId, interval)
    }

    private stopHeartbeat(userId: string) {
        const interval = this.heartbeats.get(userId)
        if (interval) {
            clearInterval(interval)
            this.heartbeats.delete(userId)
        }
    }

    cleanup() {
        this.connections.forEach((connections, userId) => {
            connections.forEach((res) => {
                res.end()
            })
            this.stopHeartbeat(userId)
        })
        this.connections.clear()
    }
}

export const notificationSSEService = new NotificationSSEService()
