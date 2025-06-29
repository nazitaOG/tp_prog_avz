import { Logger } from '@nestjs/common';

export async function handleBase<T>(
    callback: () => Promise<T>,
    errorMessage: string,
    errorHandler: (error: any, msg: string, log?: Logger) => Promise<T>,
    logger?: Logger,
): Promise<T> {
    try {
        return await callback();
    } catch (error) {
        try {
            return await errorHandler(error, errorMessage, logger);
        } catch (handledError) {
            throw handledError;
        }
    }
}
