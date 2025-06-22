import { ConflictException, HttpException, Logger, NotFoundException } from "@nestjs/common";
import { InternalServerErrorException } from "@nestjs/common";

export async function handleRequest<T>(
    callback: () => Promise<T>,
    errorMessage: string,
    logger?: Logger
): Promise<T> {
    try {
        return await callback();
    } catch (error) {
        const constraint = error?.meta?.constraint;
        const target = error?.meta?.target;

        if (error instanceof HttpException) {
            logger?.error(`${errorMessage}: ${error.message}`);
            throw error;
        }

        if (error.code === 'P2002') {
            const message = `Duplicate value for unique constraint on ${target}`;
            logger?.error(`${errorMessage}: ${message}`);
            throw new ConflictException(message);
        }

        if (error.code === 'P2025') {
            const model = error?.meta?.modelName;
            const cause = error?.meta?.cause;

            // Extraer el modelo faltante desde el cause, si existe
            const match = cause?.match(/No '(.+?)' record/);
            const relatedModel = match?.[1];

            const message = relatedModel
                ? `Related ${relatedModel} record not found (used in model ${model})`
                : `Record not found in model ${model}`;

            logger?.error(`${errorMessage}: ${message}`);
            throw new NotFoundException(message);
        }


        if (error.code === 'P2003') {
            let specificMessage = 'Foreign key reference failed';
            if (constraint?.includes('user_id')) {
                specificMessage = 'User not found';
            } else if (constraint?.includes('position_id')) {
                specificMessage = 'Position not found';
            }

            logger?.error(`${errorMessage}: ${specificMessage} (${constraint})`);

            throw new NotFoundException(specificMessage);
        }

        logger?.error(`${errorMessage}`, error.stack || error.message);
        throw new InternalServerErrorException(errorMessage);
    }
}
