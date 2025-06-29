import {
    ConflictException,
    NotFoundException,
    Logger,
} from '@nestjs/common';

export async function handlePrismaErrors(
    error: any,
    errorMessage: string,
    logger?: Logger,
): Promise<never> {
    const constraint = error?.meta?.constraint;
    const target = error?.meta?.target;

    if (error.code === 'P2002') {
        const message = `Duplicate value for unique constraint on ${target}`;
        logger?.error(`${errorMessage}: ${message}`);
        throw new ConflictException(message);
    }

    if (error.code === 'P2025') {
        const model = error?.meta?.modelName;
        const cause = error?.meta?.cause;
        const match = cause?.match(/No '(.+?)' record/);
        const relatedModel = match?.[1];

        const message = relatedModel
            ? `Related ${relatedModel} record not found (used in model ${model})`
            : `Record not found in model ${model}`;

        logger?.error(`${errorMessage}: ${message}`);
        throw new NotFoundException(message);
    }

    if (error.code === 'P2003') {
        let message = 'Foreign key reference failed';
        if (constraint?.includes('user_id')) message = 'User not found';
        else if (constraint?.includes('position_id')) message = 'Position not found';

        logger?.error(`${errorMessage}: ${message}`);
        throw new NotFoundException(message);
    }

    throw error;
}
