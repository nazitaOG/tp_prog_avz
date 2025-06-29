import { Reflector } from "@nestjs/core";
import { UserRoleGuard } from "./user-role.guard";
import { ExecutionContext, ForbiddenException, InternalServerErrorException } from "@nestjs/common";

describe('UserRoleGuard', () => {
    let guard: UserRoleGuard;
    let reflector: Reflector;
    let mockContext: ExecutionContext;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new UserRoleGuard(reflector);

        mockContext = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn(),
            }),
            getHandler: jest.fn(),
        } as unknown as ExecutionContext;
    });

    it("should return true if the user has the required role", () => {
        jest.spyOn(reflector, 'get').mockReturnValue([1]);

        (mockContext.switchToHttp as jest.Mock).mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
                user: {
                    id: '1',
                    name: 'John Doe',
                    roles: [{ role_id: 1 }],
                },
            }),
        });

        expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should throw InternalServerErrorException if user is not found in the request", () => {
        jest.spyOn(reflector, 'get').mockReturnValue([1]);
        (mockContext.switchToHttp as jest.Mock).mockReturnValue({
            getRequest: jest.fn().mockReturnValue({}),
        });

        expect(() => guard.canActivate(mockContext))
            .toThrowError(InternalServerErrorException);
    });


    it("should throw ForbiddenException if user does not have the required role", () => {
        jest.spyOn(reflector, 'get').mockReturnValue([2]);
        (mockContext.switchToHttp as jest.Mock).mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
                user: {
                    id: '1',
                    name: 'John Doe',
                    roles: [{ role_id: 1 }],
                },
            }),
        });

        expect(() => guard.canActivate(mockContext))
            .toThrowError(ForbiddenException);
    });

});