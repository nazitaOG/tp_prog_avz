import { Logger, InternalServerErrorException } from '@nestjs/common';

export async function handleBase<T>(
    callback: () => Promise<T>,
    errorMessage: string,
    errorHandler: (error: any, msg: string, log?: Logger) => Promise<T>,
    logger?: Logger,
): Promise<T> {
    try {
        return await callback();
    } catch (error) {
        logger?.error(`handleBase caught error: ${error?.message}`, error?.stack);
        try {
            return await errorHandler(error, errorMessage, logger);
        } catch (handledError) {
            logger?.error(`errorHandler failed: ${handledError?.message}`, handledError?.stack);

            if (handledError instanceof Error) {
                // si es HttpException o InternalServerError, Nest puede manejarlo
                if ('status' in handledError) throw handledError;
            }

            // fallback seguro
            throw new InternalServerErrorException(errorMessage);
        }
    }
}
