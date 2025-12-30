import multer from 'multer'
import cloudinary from '@/config/cloundinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'


const AvatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const userId = req.user?.id
        const publicId = `user_${userId}_avatar`
        const fileExtension = file.mimetype.split('/')[1]
        return {
            folder: 'avatars',
            public_id: publicId,
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
        }
    }
})

const BoardCoverStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const { boardId } = req.params
        const publicId = `board_${boardId}_cover`
        const fileExtension = file.mimetype.split('/')[1]
        return {
            folder: 'boards',
            public_id: publicId,
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [{ width: 1500, height: 500, crop: 'limit' }]
        }
    }
})

export const AvatarUpload = multer({
    storage: AvatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true)
        } else {
            cb(new Error('Only .jpg and .png format allowed!'))
        }
    }
})

export const BoardUpload = multer({
    storage: BoardCoverStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true)
        } else {
            cb(new Error('Only .jpg and .png format allowed!'))
        }
    }
})

const AttachmentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const { id } = req.params
        const timestamp = Date.now()

        return {
            folder: 'attachments',
            public_id: `card_${id}_${timestamp}`,
            resource_type: 'auto',
        }
    }
})

export const AttachmentUpload = multer({
    storage: AttachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, true)
    }
})