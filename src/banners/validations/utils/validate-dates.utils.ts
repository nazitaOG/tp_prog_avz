import { BadRequestException, Logger } from '@nestjs/common';

const validateDatesLogger = new Logger('validateDates');

export function validateDates(start: Date, end: Date | null): void {
    if (end && end <= start) {
        validateDatesLogger.error(
            `Invalid date range: start_date=${start.toISOString()}, end_date=${end.toISOString()}`
        );
        throw new BadRequestException('end_date must be after start_date');
    }
}