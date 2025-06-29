import { validateDisplayOrder } from './validate-display-order.utils';
import { BadRequestException, Logger } from '@nestjs/common';

describe('validateDisplayOrder', () => {
    let prisma: any;
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
        prisma = {
            banner: {
                findFirst: jest.fn().mockResolvedValue(null),
            },
        };
    });

    afterEach(() => {
        loggerErrorSpy.mockRestore();
    });

    it('should return silently if maxBanners is 1 or less', async () => {
        await expect(validateDisplayOrder(prisma, undefined, 1)).resolves.toBeUndefined();
    });

    it('should throw if display_order is not provided and maxBanners > 1', async () => {
        await expect(validateDisplayOrder(prisma, undefined, 3)).rejects.toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith('display_order is required but not provided');
    });

    it('should throw if display_order is out of range', async () => {
        await expect(validateDisplayOrder(prisma, 0, 3)).rejects.toThrow(BadRequestException);
        await expect(validateDisplayOrder(prisma, 4, 3)).rejects.toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('display_order out of range'));
    });

    it('should throw if display_order already exists', async () => {
        prisma.banner.findFirst.mockResolvedValueOnce({ id: 'existing-id' });
        await expect(validateDisplayOrder(prisma, 2, 3)).rejects.toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('display_order 2 already used'));
    });

    it('should not throw if display_order is valid and not used', async () => {
        await expect(validateDisplayOrder(prisma, 2, 3)).resolves.toBeUndefined();
    });

    it('should ignore conflict if excludeId matches', async () => {
        prisma.banner.findFirst.mockResolvedValueOnce(null);
        await expect(validateDisplayOrder(prisma, 2, 3, 'some-id')).resolves.toBeUndefined();
    });
});
