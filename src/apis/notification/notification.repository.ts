import { CreateNotificationDto } from "./notification.dto";
import { Notification } from "@/entities/notification.entity";
import AppDataSource from "@/config/typeorm.config";

class NotificationRepository {
    repo = AppDataSource.getRepository(Notification);

    create = async (notification: CreateNotificationDto): Promise<Notification> => {
        const newNotification = this.repo.create(notification);
        return await this.repo.save(newNotification);
    }

    findAllByUserId = async (userId: string) => {
        return await this.repo.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            relations: ['user']
        })
    }

    findOne = async (query: any) => {
        return await this.repo.findOne({
            where: query,
            relations: ['user', 'actor']
        })
    }

    update = async (query: any, data: Partial<Notification>) => {
        return await this.repo.update(query, data);
    }

    delete = async (id: string) => {
        return await this.repo.delete(id);
    }

    count = async (query: any) => {
        return await this.repo.count({
            where: query
        });
    }

}

export default new NotificationRepository();