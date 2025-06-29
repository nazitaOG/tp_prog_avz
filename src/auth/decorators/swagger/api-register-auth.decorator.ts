import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiRegisterAuth() {
    return applyDecorators(
        ApiResponse({ status: 201, description: 'User created successfully' }),
        ApiResponse({ status: 400, description: 'Bad request' }),
        ApiResponse({ status: 500, description: 'Internal server error' }),
    );
}