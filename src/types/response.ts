import z from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export enum Status {
    // ✅ Request thành công, trả về dữ liệu
    OK = 200,

    // ✅ Tạo mới thành công, ví dụ: POST /users
    CREATED = 201,

    // ✅ Đã nhận request nhưng xử lý bất đồng bộ (thường dùng cho queue hoặc long processing)
    ACCEPTED = 202,

    // ✅ Xử lý xong nhưng không trả về nội dung (ví dụ: xóa thành công)
    NO_CONTENT = 204,

    // 🔁 Chuyển hướng vĩnh viễn sang URL khác (SEO, redirect domain)
    MOVED_PERMANENTLY = 301,

    // 🔁 Chuyển hướng tạm thời, dùng trong login flow, payment, v.v.
    FOUND = 302,

    // 🔁 Không có thay đổi, client có thể dùng cache (ETag, Last-Modified)
    NOT_MODIFIED = 304,

    // ❌ Dữ liệu không hợp lệ (thiếu field, sai format,...)
    BAD_REQUEST = 400,

    // ❌ Chưa xác thực (thiếu token hoặc token không hợp lệ)
    UNAUTHORIZED = 401,

    // ❌ Đã xác thực nhưng không đủ quyền (vd: không phải admin)
    FORBIDDEN = 403,

    // ❌ Không tìm thấy resource (vd: id không tồn tại)
    NOT_FOUND = 404,

    // ❌ Gửi request bằng method không được hỗ trợ (vd: PUT thay vì POST)
    METHOD_NOT_ALLOWED = 405,

    // ❌ Mâu thuẫn dữ liệu (vd: đăng ký email đã tồn tại)
    CONFLICT = 409,

    // ❌ Dữ liệu đúng cú pháp nhưng không xử lý được (vd: validation custom, business logic)
    UNPROCESSABLE_ENTITY = 422,

    // ❌ Gửi request quá nhiều trong thời gian ngắn (rate limiting)
    TOO_MANY_REQUESTS = 429,

    // ❌ Lỗi server nội bộ (bug code, không bắt được exception)
    INTERNAL_SERVER_ERROR = 500,

    // ❌ Endpoint chưa được triển khai (ví dụ: đang để placeholder)
    NOT_IMPLEMENTED = 501,

    // ❌ Server nhận request từ upstream bị lỗi (vd: proxy hoặc service khác chết)
    BAD_GATEWAY = 502,

    // ❌ Server quá tải hoặc đang bảo trì
    SERVICE_UNAVAILABLE = 503,

    // ❌ Hết thời gian chờ phản hồi từ upstream service
    GATEWAY_TIMEOUT = 504
}

// export interface Link {
//     rel : string,
//     href : string,
//     method : 'GET' | 'POST' | 'PUT' | 'DELETE'
// }

export const StatusEnumSchema = z.nativeEnum(Status).openapi({
    description: 'HTTP status code',
    examples: [200, 400, 500]
})

export interface ApiResponse<T> {
    status: Status
    message: string
    data?: T
}

export interface ApiErrorResponse {
    status: Status
    message: string
    error?: string
}

export const ApiResponseSchema = <T extends z.ZodTypeAny>(statusCode: number,message: string, dataSchema: T) =>
    z.object({
        status: z.literal(statusCode).openapi({ description: 'HTTP status code' }),
        message: z.literal(message).openapi({ description: 'Response message' }),
        data: dataSchema.optional()
    })
