import { BadRequestException, Logger } from '@nestjs/common';
import { RenewalStrategy } from '@prisma/client';

const validateRenewalLogger = new Logger('validateRenewalLogic');

export function validateRenewalLogic(
    strategy: any,
    period?: number,
    end?: Date | null
): void {
    // Validate strategy is a valid RenewalStrategy
    if (!Object.values(RenewalStrategy).includes(strategy)) {
        validateRenewalLogger.error(`Invalid renewal_strategy: ${strategy}`);
        throw new BadRequestException(`Invalid renewal_strategy: ${strategy}`);
    }

    // If an end_date is provided, renewal_period should not be set
    if (end != null && period != null) {
        validateRenewalLogger.error('renewal_period must not be provided when end_date is set');
        throw new BadRequestException('renewal_period must be omitted when end_date is defined');
    }

    // Automatic strategy requires a valid renewal_period
    if (strategy === RenewalStrategy.automatic) {
        if (period == null) {
            validateRenewalLogger.error('Missing renewal_period for automatic strategy');
            throw new BadRequestException('renewal_period is required for automatic strategy');
        }
        if (![30, 60, 90].includes(period)) {
            validateRenewalLogger.error(`Invalid renewal_period: ${period}`);
            throw new BadRequestException('renewal_period must be 30, 60, or 90');
        }
    }

    // Manual strategy requires an end_date
    if (strategy === RenewalStrategy.manual) {
        if (!end) {
            validateRenewalLogger.error('manual renewal requires an end_date');
            throw new BadRequestException('end_date is required for manual renewal strategy');
        }
    }
}