import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginUserDto } from './login-user.dto';

describe('LoginUserDto', () => {
    it('should be valid with correct email and password', async () => {
        const dto = plainToInstance(LoginUserDto, {
            email: 'user@example.com',
            password: 'user123',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should apply lowercase and trim transformations to email', () => {
        const input = {
            email: "  USER@EXAMPLE.COM '",
            password: 'pass123',
        };

        const result = plainToInstance(LoginUserDto, input);

        expect(result.email).toBe('user@example.com');
    });

    it('should be invalid if email is missing', async () => {
        const dto = plainToInstance(LoginUserDto, {
            password: 'user123',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'email')).toBe(true);
    });

    it('should be invalid if password is missing', async () => {
        const dto = plainToInstance(LoginUserDto, {
            email: 'user@example.com',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'password')).toBe(true);
    });

    it('should be invalid if email is not a string', async () => {
        const dto = plainToInstance(LoginUserDto, {
            email: 12345 as any,
            password: 'user123',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'email')).toBe(true);
    });

    it('should be invalid if password is not a string', async () => {
        const dto = plainToInstance(LoginUserDto, {
            email: 'user@example.com',
            password: 99999 as any,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'password')).toBe(true);
    });
});
