import { ApiResponse, ApiErrorResponse, Status } from '@/types/response'

export function successResponse<T>(status: Status = Status.OK, message: string, data?: T): ApiResponse<T> {
    return {
        status,
        message,
        data
    }
}

export function errorResponse(
    status: Status = Status.INTERNAL_SERVER_ERROR,
    message: string,
    error?: any,
    error_code?: string
): ApiErrorResponse {
    return {
        status,
        message,
        error,
        error_code
    }
}