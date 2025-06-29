import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiLoginAuth() {
    return applyDecorators(
        ApiResponse({ status: 200, description: 'User logged in successfully' }),   
        ApiResponse({ status: 400, description: 'Bad request' }),
        ApiResponse({ status: 500, description: 'Internal server error' }),
    );
}