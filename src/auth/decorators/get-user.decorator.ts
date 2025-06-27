import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import { UserWithRoles } from "../../prisma/interfaces/user-with-role.interface";

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const user = ctx.switchToHttp().getRequest().user as UserWithRoles;

        if (!user) {
            throw new InternalServerErrorException('User not found (request)');
        }

        return user as UserWithRoles;
    }
);