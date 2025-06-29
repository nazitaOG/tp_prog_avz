import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteBanner() {
    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiResponse({ status: 200, description: 'Banner deleted successfully' }),
        ApiResponse({ status: 400, description: 'Bad request' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiResponse({ status: 404, description: 'Banner not found' }),
        ApiResponse({ status: 500, description: 'Internal server error' })
    );
}