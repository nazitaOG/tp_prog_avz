import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterUserDto } from './register-user.dto';

describe('RegisterUserDto', () => {
    it('should be valid with all correct fields', async () => {
        const dto = plainToInstance(RegisterUserDto, {
            name: 'John Doe',
            email: 'test@test.com',
            password: 'StrongPass123!',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be valid without name (optional)', async () => {
        const dto = plainToInstance(RegisterUserDto, {
            email: 'test@test.com',
            password: 'StrongPass123!',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should apply lowercase and trim transformations on email and name', () => {
        const input = {
            name: "  John D'oe ",
            email: "  TEST@TEST.COM  ",
            password: 'StrongPass123!',
        };

        const result = plainToInstance(RegisterUserDto, input);

        expect(result.name).toBe("john d'oe");
        expect(result.email).toBe("test@test.com");
    });


    it('should be invalid if email is not provided', async () => {
        const dto = plainToInstance(RegisterUserDto, {
            password: 'StrongPass123!',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'email')).toBe(true);
    });

    it('should be invalid if password is not strong', async () => {
        const dto = plainToInstance(RegisterUserDto, {
            email: 'test@test.com',
            password: '123',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'password')).toBe(true);
    });

    it('should be invalid if name is too short', async () => {
        const dto = plainToInstance(RegisterUserDto, {
            name: 'ab',
            email: 'test@test.com',
            password: 'StrongPass123!',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'name')).toBe(true);
    });

    it('should be invalid if email is not lowercase string', async () => {
        const dto = plainToInstance(RegisterUserDto, {
            email: 12345 as any,
            password: 'StrongPass123!',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'email')).toBe(true);
    });
});
