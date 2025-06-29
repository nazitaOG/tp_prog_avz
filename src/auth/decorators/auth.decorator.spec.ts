import { applyDecorators, UseGuards } from "@nestjs/common";
import { ValidRoles } from "../interfaces/valid-roles.interface";
import { Auth } from "./auth.decorator";
import { RoleProtected } from "./role-protected.decorator";
import { AuthGuard } from "@nestjs/passport";
import { UserRoleGuard } from "../guards/user-role/user-role.guard";

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn(),
    UseGuards: jest.fn(),
}));
jest.mock('@nestjs/passport', () => ({
    AuthGuard: jest.fn(() => "AuthGuard devuelve un valor"),
}));

jest.mock('../guards/user-role/user-role.guard', () => ({
    UserRoleGuard: jest.fn(() => "UserRoleGuard devuelve un valor"),
}));

jest.mock('./role-protected.decorator', () => ({
    RoleProtected: jest.fn(() => "RoleProtected devuelve un valor"),
}));

describe('Auth Decorator', () => {
    it('should call applyDecorators with Role Protected and UseGuards', () => {
        const roles = [ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user];

        Auth(...roles);

        expect(applyDecorators).toHaveBeenCalledWith(
            RoleProtected(...roles),
            UseGuards(AuthGuard('jwt'), UserRoleGuard)
        );
    });
});