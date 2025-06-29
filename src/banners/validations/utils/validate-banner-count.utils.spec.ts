import { BadRequestException, Logger } from '@nestjs/common';
import { validateBannerCount } from './validate-banner-count.utils';

describe('validateBannerCount', () => {
    let prisma: any;
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
        prisma = {
            banner: {
                count: jest.fn().mockResolvedValue(0),
            },
        };
    });

    afterEach(() => {
        loggerErrorSpy.mockRestore();
    });

    it('should not throw if count is below max', async () => {
        prisma.banner.count.mockResolvedValueOnce(2);
        await expect(validateBannerCount(prisma, 1, new Date(), null, 3)).resolves.toBeUndefined();
    });

    it('should throw if count is equal or above max', async () => {
        prisma.banner.count.mockResolvedValueOnce(3);
        await expect(validateBannerCount(prisma, 1, new Date(), null, 3)).rejects.toThrow(BadRequestException);
        expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Limit reached'));
    });

    it('should handle banners with an end_date and calculate overlapping correctly', async () => {
        prisma.banner.count.mockResolvedValueOnce(1);
        await expect(validateBannerCount(prisma, 1, new Date('2025-06-01'), new Date('2025-06-30'), 3)).resolves.toBeUndefined();
    });

    it('should respect excludeId when counting', async () => {
        prisma.banner.count.mockResolvedValueOnce(0);
        await expect(validateBannerCount(prisma, 1, new Date(), null, 3, '123')).resolves.toBeUndefined();
    });
});
