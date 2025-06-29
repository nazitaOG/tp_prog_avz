import { validateDates } from './validate-dates.utils';
import { BadRequestException, Logger } from '@nestjs/common';

describe('validateDates', () => {
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        loggerErrorSpy.mockRestore();
    });

    it('should not throw if end is null', () => {
        const start = new Date('2025-06-01T00:00:00Z');
        expect(() => validateDates(start, null)).not.toThrow();
    });

    it('should not throw if end is after start', () => {
        const start = new Date('2025-06-01T00:00:00Z');
        const end = new Date('2025-06-02T00:00:00Z');
        expect(() => validateDates(start, end)).not.toThrow();
    });

    it('should throw BadRequestException if end is equal to start', () => {
        const start = new Date('2025-06-01T00:00:00Z');
        const end = new Date('2025-06-01T00:00:00Z');
        expect(() => validateDates(start, end)).toThrow(BadRequestException);
        expect(() => validateDates(start, end)).toThrow('end_date must be after start_date');
        expect(loggerErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Invalid date range: start_date='),
        );
    });

    it('should throw BadRequestException if end is before start', () => {
        const start = new Date('2025-06-02T00:00:00Z');
        const end = new Date('2025-06-01T00:00:00Z');
        expect(() => validateDates(start, end)).toThrow(BadRequestException);
        expect(() => validateDates(start, end)).toThrow('end_date must be after start_date');
        expect(loggerErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Invalid date range: start_date='),
        );
    });
});
