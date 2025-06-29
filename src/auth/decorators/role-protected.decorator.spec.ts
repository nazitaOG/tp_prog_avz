import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces/valid-roles.interface';
import { RoleProtected, META_ROLES } from './role-protected.decorator';

jest.mock('@nestjs/common', () => ({
    SetMetadata: jest.fn(),
}));

describe('RoleProtected Decorator', () => {
    it('should set metadata with roles', () => {
        const roles = [ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user];

        RoleProtected(...roles);

        expect(SetMetadata).toHaveBeenCalledWith(META_ROLES, roles);
    });
});
