import { BadRequestException, Logger } from '@nestjs/common';

export function handleMulterErrors(error: any, errorMessage: string, logger?: Logger): never {
    if (error?.name === 'MulterError') {
        if (error.code === 'LIMIT_FILE_SIZE') {
            logger?.error(`${errorMessage}: File too large`);
            throw new BadRequestException('File too large (max 5MB)');
        }

        logger?.error(`${errorMessage}: Multer error`);
        throw new BadRequestException('Error processing file');
    }

    throw error;
}
