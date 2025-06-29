import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';
import { Logger } from '@nestjs/common';

describe('UpdateUserDto', () => {
    beforeAll(() => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    it('should be valid with one field (email)', async () => {
        const dto = plainToInstance(UpdateUserDto, {
            email: 'test@test.com',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be valid with multiple fields', async () => {
        const dto = plainToInstance(UpdateUserDto, {
            name: 'Juan',
            email: 'test@test.com',
            password: 'Str0ngP@ssword!',
            roles: ['user'],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be invalid with no fields', async () => {
        const dto = plainToInstance(UpdateUserDto, {});

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.constraints?.atLeastOneField)).toBe(true);
    });

    it('should be invalid with weak password', async () => {
        const dto = plainToInstance(UpdateUserDto, {
            password: '123',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'password')).toBe(true);
    });

    it('should be invalid with malformed email', async () => {
        const dto = plainToInstance(UpdateUserDto, {
            email: 'invalidemail',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'email')).toBe(true);
    });

    it('should be invalid with short name', async () => {
        const dto = plainToInstance(UpdateUserDto, {
            name: 'Al',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'name')).toBe(true);
    });

    it('should be invalid with roles not as string[]', async () => {
        const dto = plainToInstance(UpdateUserDto, {
            roles: ['user', 123 as any],
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'roles')).toBe(true);
    });
});