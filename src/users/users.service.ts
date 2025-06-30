import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { handleRequest } from 'src/common/utils/hadle-request/handle-request';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';


@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) { }

  create(createUserDto: CreateUserDto, userWithRoles: UserWithRoles) {
    return handleRequest(
      async () => {
        const isAdmin = userWithRoles.roles.some(
          (r) => r.role_id === ValidRoles.admin,
        );
        if (!isAdmin) {
          throw new ForbiddenException(
            'Esta ruta solo la puede usar el admin',
          );
        }

        const roles =
          createUserDto.roles && createUserDto.roles.length > 0
            ? createUserDto.roles
            : ['user'];

        const hashed_password = await bcrypt.hash(
          createUserDto.password,
          10,
        );

        const name =
          createUserDto.name ??
          createUserDto.email.split('@')[0];

        const user = await this.prisma.user.create({
          data: {
            name,
            email: createUserDto.email,
            hashed_password,
            roles: {
              create: roles.map((roleName) => ({
                role: { connect: { name: roleName } },
              })),
            },
          },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });

        const { hashed_password: _, ...userWithoutPassword } =
          user;
        return { user: userWithoutPassword };
      },
      'Failed to create user',
      this.logger,
    );
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return handleRequest(
      () => this.prisma.user.findMany({
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          registered_at: true,
          banners: true,
          roles: true,
        },
      }),

      'Failed to retrieve users',
      this.logger,
    );
  }

  findOne(term?: string) {
    return handleRequest(async () => {
      if (!term) {
        this.logger.error('No term provided');
        throw new BadRequestException('No term provided');
      }

      const isId = isUUID(term);

      const user = await this.prisma.user.findUnique({
        where: isId ? { id: term } : { email: term }
      });
      if (!user) {
        this.logger.error(`User ${term} not found`);
        throw new NotFoundException(`Failed to find user`);
      }
      const { hashed_password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
      `Failed to find user`
    );
  }

  async update(
    dto: UpdateUserDto,
    user: UserWithRoles,
    term?: string,
  ) {
    return handleRequest(
      async () => {
        const isAdmin = user.roles.some(r => r.role_id === ValidRoles.admin);
        const { roles: dtoRoles, password, ...rest } = dto;

        // Self-update: term omitted
        if (!term) {
          if (isAdmin) {
            throw new BadRequestException('Admin cannot update his own account');
          }
          // non-admin cannot change roles
          if (dtoRoles) {
            throw new ForbiddenException('You are not authorized to change roles');
          }
          const data: any = { ...rest };
          if (password) data.hashed_password = await bcrypt.hash(password, 10);
          const updated = await this.prisma.user.update({
            where: { id: user.id },
            data,
            include: { roles: true },
          });
          const { hashed_password: _, ...u } = updated;
          return { user: u };
        }

        // term provided: update other
        if (!isAdmin) {
          throw new BadRequestException('You must not provide an id or email if you are not admin');
        }
        const isTermId = isUUID(term);
        const isTermEmail = term.includes('@');
        if (!isTermId && !isTermEmail) {
          throw new BadRequestException('You must provide a valid id or email');
        }
        // cannot target self
        if (term === user.id || term === user.email) {
          throw new BadRequestException('Admin cannot update his own account');
        }
        // handle roles change
        if (dtoRoles) {
          const target = await this.prisma.user.findUnique({
            where: isTermId ? { id: term } : { email: term },
            include: { roles: true },
          });
          if (target?.roles.some(r => r.role_id === ValidRoles.admin)) {
            throw new ForbiddenException('Cannot change roles of an admin user');
          }
        }
        const data: any = { ...rest };
        if (password) data.hashed_password = await bcrypt.hash(password, 10);
        if (dtoRoles) {
          data.roles = {
            deleteMany: {},
            create: dtoRoles.map(name => ({ role: { connect: { name } } })),
          };
        }
        const updated = await this.prisma.user.update({
          where: isTermId ? { id: term } : { email: term },
          data,
          include: { roles: true },
        });
        const { hashed_password: __, ...u2 } = updated;
        return { user: u2 };
      },
      'Failed to update user',
      this.logger,
    );
  }

  async remove(
    user: UserWithRoles,
    term?: string,
  ) {
    return handleRequest(
      async () => {
        const isAdmin = user.roles.some(r => r.role_id === ValidRoles.admin);

        // Self-delete: term omitted
        if (!term) {
          if (isAdmin) {
            throw new BadRequestException('Admin cannot delete their own account');
          }
          await this.prisma.user.delete({ where: { id: user.id } });
          return;
        }

        // term provided: delete other
        if (!isAdmin) {
          throw new BadRequestException('You must not provide an id or email if you are not admin');
        }
        const isTermId = isUUID(term);
        const isTermEmail = term.includes('@');
        if (!isTermId && !isTermEmail) {
          throw new BadRequestException('You must provide a valid id or email');
        }
        if (term === user.id || term === user.email) {
          throw new ForbiddenException('Admin cannot delete their own account');
        }
        const targetUser = await this.prisma.user.findUnique({
          where: isTermId ? { id: term } : { email: term },
          include: { roles: true },
        });
        
        // para evitar que se borre un admin
        if (targetUser?.roles.some(r => r.role_id === ValidRoles.admin)) {
          throw new ForbiddenException('Cannot delete an admin user');
        }
        const deleted = await this.prisma.user.delete({
          where: isTermId ? { id: term } : { email: term },
          include: { roles: true, banners: true },
        });

        const { hashed_password: _, ...u } = deleted;
        return { user: u };
      },
      'Failed to delete user',
      this.logger,
    );
  }
}
