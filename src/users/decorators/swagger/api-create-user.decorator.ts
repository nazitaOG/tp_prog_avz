import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

export function ApiCreateUser() {
    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiResponse({ status: 201, description: 'User created successfully' }),
        ApiResponse({ status: 400, description: 'Bad request' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiResponse({ status: 500, description: 'Internal server error' })
    );
}