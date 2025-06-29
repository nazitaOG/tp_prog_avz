import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

export function ApiUpdateBanner() {
    return applyDecorators(
        ApiBearerAuth('JWT-auth'),
        ApiResponse({ status: 200, description: 'Banner updated successfully' }),
        ApiResponse({ status: 400, description: 'Bad request' }),
        ApiResponse({ status: 401, description: 'Unauthorized' }),
        ApiResponse({ status: 403, description: 'Forbidden' }),
        ApiResponse({ status: 404, description: 'Banner not found' }),
        ApiResponse({ status: 500, description: 'Internal server error' }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    destination_link: {
                        type: 'string',
                        format: 'url',
                        description: 'The destination link of the banner',
                        example: 'https://www.google.com',
                    },
                    start_date: {
                        type: 'string',
                        format: 'date',
                        description: 'The start date of the banner (YYYY-MM-DD)',
                        example: '2025-07-01',
                    },
                    end_date: {
                        type: 'string',
                        format: 'date',
                        description: 'The end date of the banner (YYYY-MM-DD)',
                        example: '2025-08-01',
                    },
                    position_id: {
                        type: 'number',
                        enum: [1, 2, 3, 4],
                        description: 'The position id of the banner',
                        example: 1,
                    },
                    renewal_strategy: {
                        type: 'string',
                        enum: ['automatic', 'manual'],
                        description: 'The renewal strategy of the banner',
                        example: 'manual',
                    },
                    renewal_period: {
                        type: 'number',
                        enum: [30, 60, 90],
                        description: 'The renewal period of the banner in days',
                        example: 30,
                    },
                    file: {
                        type: 'string',
                        format: 'binary',
                        description: 'The image file of the banner',
                    },
                },
                required: [],
            },
        }),
    );
}