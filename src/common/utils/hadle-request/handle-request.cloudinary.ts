import { InternalServerErrorException, Logger } from '@nestjs/common';

export function handleCloudinaryErrors(error: any, errorMessage: string, logger?: Logger): never {
    if (error?.message?.includes('Must supply api_key')) {
        logger?.error(`${errorMessage}: Cloudinary misconfiguration`);
        throw new InternalServerErrorException('Cloudinary not configured properly');
    }

    throw error;
}
