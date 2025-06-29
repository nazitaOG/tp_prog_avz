import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiGetAllActiveBanners() {
    return applyDecorators(
        ApiResponse({ status: 200, description: 'Banners retrieved successfully' }),
        ApiResponse({ status: 500, description: 'Internal server error' }),
    );
}