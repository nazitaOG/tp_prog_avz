import { CanActivate, ExecutionContext, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { META_ROLES } from '../../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: number[] = this.reflector.get(META_ROLES, context.getHandler());
    const user = context.switchToHttp().getRequest().user as UserWithRoles;
    
    if (!user) throw new InternalServerErrorException('User not found');
    for (const role of validRoles) {
      if (user.roles.some(r => r.role_id === role)) {
        return true;
      }
    }

    throw new ForbiddenException(`User ${user.name} does not have the required role: ${validRoles}`);
  }
}
