import { InternalServerErrorException, Logger } from '@nestjs/common';

export async function handleNotificationErrors<T>(
    callback: () => Promise<T>,
    errorMessage: string,
    logger?: Logger,
): Promise<T> {
    try {
        return await callback();
    } catch (error) {
        logger?.error(`${errorMessage}: ${error.message}`, error.stack);
        throw new InternalServerErrorException(errorMessage);
    }
}
