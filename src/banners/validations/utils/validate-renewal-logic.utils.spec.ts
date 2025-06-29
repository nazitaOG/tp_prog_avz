import { validateRenewalLogic } from './validate-renewal-logic.utils';
import { BadRequestException, Logger } from '@nestjs/common';
import { RenewalStrategy } from '@prisma/client';

describe('validateRenewalLogic', () => {
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        loggerErrorSpy.mockRestore();
    });

    it('should throw if strategy is invalid', () => {
        expect(() => validateRenewalLogic('invalid')).toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid renewal_strategy: invalid');
    });

    it('should throw if end_date is set and period is also set', () => {
        expect(() => validateRenewalLogic(RenewalStrategy.manual, 30, new Date())).toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith('renewal_period must not be provided when end_date is set');
    });

    it('should throw if automatic strategy is missing period', () => {
        expect(() => validateRenewalLogic(RenewalStrategy.automatic)).toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Missing renewal_period for automatic strategy');
    });

    it('should throw if automatic strategy has invalid period', () => {
        expect(() => validateRenewalLogic(RenewalStrategy.automatic, 45)).toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Invalid renewal_period: 45');
    });

    it('should throw if manual strategy has no end_date', () => {
        expect(() => validateRenewalLogic(RenewalStrategy.manual)).toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith('manual renewal requires an end_date');
    });

    it('should not throw for valid automatic strategy with valid period', () => {
        expect(() => validateRenewalLogic(RenewalStrategy.automatic, 30)).not.toThrow();
    });

    it('should not throw for valid manual strategy with end_date', () => {
        expect(() => validateRenewalLogic(RenewalStrategy.manual, undefined, new Date())).not.toThrow();
    });
});
