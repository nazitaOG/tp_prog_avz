import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

function expectErrorOn(errors: any[], property: string) {
    expect(errors.some(e => e.property === property)).toBe(true);
}

describe('CreateUserDto', () => {
    it('should be valid with correct data', async () => {
        const dto = plainToInstance(CreateUserDto, {
            name: 'John Doe',
            email: 'test@test.com',
            password: 'StrongPass1!',
            roles: ['user'],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be valid without optional fields (name, roles)', async () => {
        const dto = plainToInstance(CreateUserDto, {
            email: 'test@test.com',
            password: 'StrongPass1!',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should be invalid with invalid email', async () => {
        const dto = plainToInstance(CreateUserDto, {
            email: 'invalid-email',
            password: 'StrongPass1!',
        });

        const errors = await validate(dto);
        expectErrorOn(errors, 'email');
    });

    it('should be invalid with empty email', async () => {
        const dto = plainToInstance(CreateUserDto, {
            email: '',
            password: 'StrongPass1!',
        });

        const errors = await validate(dto);
        expectErrorOn(errors, 'email');
    });

    it('should be invalid with non-strong password', async () => {
        const dto = plainToInstance(CreateUserDto, {
            email: 'test@test.com',
            password: '123',
        });

        const errors = await validate(dto);
        expectErrorOn(errors, 'password');
    });

    it('should be invalid if roles is not array', async () => {
        const dto = plainToInstance(CreateUserDto, {
            email: 'test@test.com',
            password: 'StrongPass1!',
            roles: 'admin' as any,
        });

        const errors = await validate(dto);
        expectErrorOn(errors, 'roles');
    });

    it('should be invalid if roles contains non-string values', async () => {
        const dto = plainToInstance(CreateUserDto, {
            email: 'test@test.com',
            password: 'StrongPass1!',
            roles: ['user', 123 as any],
        });

        const errors = await validate(dto);
        expectErrorOn(errors, 'roles');
    });

    it('should be invalid if name is too short', async () => {
        const dto = plainToInstance(CreateUserDto, {
            name: 'JD',
            email: 'test@test.com',
            password: 'StrongPass1!',
        });

        const errors = await validate(dto);
        expectErrorOn(errors, 'name');
    });
});
