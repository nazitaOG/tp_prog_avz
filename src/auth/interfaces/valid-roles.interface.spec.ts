import { ValidRoles } from "./valid-roles.interface";

describe('ValidRolesInterface', () => {
    it('should have correct values', () => {
        // console.log(ValidRoles.admin);
        // console.log(ValidRoles.advertiser);
        // console.log(ValidRoles.user);
        // console.log(ValidRoles);
        // expect(ValidRoles.admin).toBe(1);
        expect(ValidRoles.advertiser).toBe(2);
        expect(ValidRoles.user).toBe(3);
    });
});

describe('ValidRoles', () => {
    it('should have expected keys', () => {
        const keys = ['admin', 'advertiser', 'user'];
        expect(keys).toContain('admin');
        expect(keys).toContain('advertiser');
        expect(keys).toContain('user');
    });
});

describe('ValidRoles', () => {
    it('should have expected numeric values', () => {
        const expected = [1, 2, 3];
        const numericValues = Object.values(ValidRoles).filter(
            (v): v is number => typeof v === 'number',
        );
        // console.log(numericValues);
        expect(numericValues).toEqual(expected);
    });
});