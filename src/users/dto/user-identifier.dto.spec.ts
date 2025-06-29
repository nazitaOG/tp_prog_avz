import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserIdentifierDto } from './user-identifier.dto';

describe('UserIdentifierDto', () => {
    it('should be valid with a proper email string', async () => {
        const dto = plainToInstance(UserIdentifierDto, {
            term: 'user@example.com',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should apply lowercase and trim transformations', () => {
        const dto = plainToInstance(UserIdentifierDto, {
            term: "  USER@EXAMPLE.COM '",
        });

        expect(dto.term).toBe('user@example.com');
    });

    it('should be invalid if term is an empty string', async () => {
        const dto = plainToInstance(UserIdentifierDto, {
            term: '',
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'term')).toBe(true);
    });

    it('should be invalid if term is missing', async () => {
        const dto = plainToInstance(UserIdentifierDto, {});

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'term')).toBe(true);
    });

    it('should be invalid if term is not a string', async () => {
        const dto = plainToInstance(UserIdentifierDto, {
            term: 12345 as any,
        });

        const errors = await validate(dto);
        expect(errors.some(e => e.property === 'term')).toBe(true);
    });
});
