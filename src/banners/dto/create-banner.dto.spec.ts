import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBannerDto } from './create-banner.dto';

describe('CreateBannerDto', () => {
    it('should be valid with correct data', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            start_date: '2025-07-01',
            end_date: '2025-08-01',
            position_id: 1,
            renewal_strategy: 'manual',
            renewal_period: 30,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be valid with only required fields', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            position_id: 1,
            renewal_strategy: 'manual',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be invalid with unknown renewal_strategy', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            position_id: 1,
            renewal_strategy: 'unknown',
        });

        // nueva manera que vi en el curso
        const errors = await validate(dto);
        const renewalStrategyError = errors.find(e => e.property === 'renewal_strategy');
        expect(renewalStrategyError).toBeDefined();
        expect(renewalStrategyError?.constraints).toBeDefined();
        expect(renewalStrategyError?.constraints?.isEnum).toBeDefined();
    });

    it('should be invalid with negative position_id', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            position_id: -1,
            renewal_strategy: 'manual',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'position_id')).toBe(true);

    });

    it('should be invalid with non-allowed renewal_period', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            position_id: 1,
            renewal_strategy: 'manual',
            renewal_period: 45,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'renewal_period')).toBe(true);
    });

    it('should be invalid with malformed destination_link', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'httom',
            position_id: 1,
            renewal_strategy: 'manual',
            renewal_period: 30,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'destination_link')).toBe(true);
    });

    it('should be invalid with invalid start_date format', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            start_date: '202506-28',
            end_date: '2025-06-29',
            position_id: 1,
            renewal_strategy: 'manual',
            renewal_period: 30,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'start_date')).toBe(true);
    });

    it('should be invalid with display_order > 3', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            position_id: 1,
            renewal_strategy: 'manual',
            display_order: 5,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'display_order')).toBe(true);
    });

    it('should be invalid with display_order <= 0', async () => {
        const dto = plainToInstance(CreateBannerDto, {
            destination_link: 'https://www.google.com',
            position_id: 1,
            renewal_strategy: 'manual',
            display_order: 0,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'display_order')).toBe(true);
    });
});
