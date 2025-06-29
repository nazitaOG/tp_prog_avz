import { ExecutionContext } from "@nestjs/common";
import { getUser } from "./get-user.decorator";
import { UserWithRoles } from "../../common/prisma/interfaces/user-with-role.interface";

describe('getUser Decorator', () => {
    const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
                user: { id: '1', name: 'John Doe', email: 'john.doe@example.com', roles: [] } as UserWithRoles,
            }),
        }),
    } as unknown as ExecutionContext;

    it ("should return the user", () => {
        const result = getUser("", mockExecutionContext);
        expect(result).toEqual({ id: '1', name: 'John Doe', email: 'john.doe@example.com', roles: [] });
    })
    
});

