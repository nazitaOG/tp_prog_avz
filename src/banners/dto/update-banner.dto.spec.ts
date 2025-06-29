import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateBannerDto } from './update-banner.dto';
import { Logger } from '@nestjs/common';

describe('UpdateBannerDto', () => {
    
    beforeAll(() => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    it('should be valid with at least one field', async () => {
        const dto = plainToInstance(UpdateBannerDto, { destination_link: 'https://example.com' });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be invalid with no fields', async () => {
        const dto = plainToInstance(UpdateBannerDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('atLeastOneField');
    });

    it('should be valid with one optional field (renewal_period)', async () => {
        const dto = plainToInstance(UpdateBannerDto, { renewal_period: 30 });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be invalid with invalid URL even if it has one field', async () => {
        const dto = plainToInstance(UpdateBannerDto, { destination_link: 'not a url' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'destination_link')).toBe(true);
    });
});
