import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleRequest } from 'src/utils/hadle-request/handle-request';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserWithRoles } from 'src/prisma/interfaces/user-with-role.interface';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';


@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) { }

  create(createUserDto: CreateUserDto, userWithRoles: UserWithRoles) {
    return handleRequest(async () => {

      const roles = createUserDto.roles?.length ? createUserDto.roles : ['user'];
      if (
        !userWithRoles.roles.some(r => r.role_id === ValidRoles.admin) &&
        roles.some(r => r === 'admin' || r === 'advertiser')
      ) {
        throw new ForbiddenException('You are not authorized to assign admin or advertiser');
      }


      const hashed_password = await bcrypt.hash(createUserDto.password, 10);

      const name = createUserDto.name ?? createUserDto.email.split('@')[0];

      const user = await this.prisma.user.create({
        data: {
          name: name,
          email: createUserDto.email,
          hashed_password,
          roles: {
            create: roles.map(roleName => ({
              role: {
                connect: { name: roleName }
              }
            }))
          }
        },
      });

      const { hashed_password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword };

    }, 'Failed to create user', this.logger);
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return handleRequest(
      () => this.prisma.user.findMany({
        // make this way to avoid returning the password
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

  findOne(term: string) {
    return handleRequest(async () => {
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
    term: string,
    dto: UpdateUserDto,
    user: UserWithRoles,
  ) {
    return handleRequest(async () => {
      const isAdmin = user.roles.some(r => r.role_id === ValidRoles.admin);
      const { roles: dtoRoles, password, ...restDto } = dto;

      // Only admin can change roles
      if (!isAdmin && dtoRoles) {
        throw new ForbiddenException('You are not authorized to change roles');
      }

      if (!isAdmin && term.length === 0) {
        throw new BadRequestException('You must provide an id or email if you are not admin');
      }

      let hashed: string | undefined;
      if (password) {
        hashed = await bcrypt.hash(password, 10);
      }

      // no-admin can only update himself
      if (!isAdmin) {
        const userUpdated = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...restDto,
            ...(hashed && { hashed_password: hashed }),
          },
          include: { roles: true },
        });
        const { hashed_password: _, ...userWithoutPassword } = userUpdated;
        return { user: userWithoutPassword };
      }

      // admin can only update other users by id or email
      const isId = isUUID(term);
      const isEmail = term.includes('@');
      if (!isId && !isEmail) {
        throw new BadRequestException('You must provide a valid id or email');
      }
      if ((isId && term === user.id) ||
        (isEmail && term === user.email)) {
        throw new BadRequestException('Admin cannot update his own account');
      }

      // admin can update other users by id or email
      const userUpdated = await this.prisma.user.update({
        where: isId ? { id: term } : { email: term },
        data: {
          ...restDto,
          ...(hashed && { hashed_password: hashed }),
          ...(dtoRoles && {
            roles: {
              deleteMany: {},
              create: dtoRoles.map(name => ({
                role: { connect: { name } }
              })),
            },
          }),
        },
        include: { roles: true },
      });

      const { hashed_password: _, ...userWithoutPassword } = userUpdated;

      return { user: userWithoutPassword };

    }, 'Failed to update user', this.logger);
  }



  async remove(term: string, user: UserWithRoles) {
    const isAdmin = user.roles.some(r => r.role_id === ValidRoles.admin);
    const isId = isUUID(term);
    const isEmail = term.includes('@');

    return handleRequest(
      async () => {

        // no-admin can only delete himself
        if (!isAdmin) {
          if (term.length === 0) {
            return this.prisma.user.delete({ where: { id: user.id } });
          }
          else {
            throw new BadRequestException('You must not provide an id or email if you are not admin');
          }
        }

        // admin can only delete other users
        if (!isId && !isEmail) {
          throw new BadRequestException('You must provide a valid id or email');
        }

        // admin cant delete himself
        if ((isId && term === user.id) ||
          (isEmail && term === user.email)) {
          throw new ForbiddenException('Admin cannot delete their own account');
        }

        // admin can delete other users by id or email
        const userDeleted = await this.prisma.user.delete({
          where: isId ? { id: term } : { email: term },
        });

        const { hashed_password: _, ...userWithoutPassword } = userDeleted;

        return { user: userWithoutPassword };
      },

      'Failed to delete user', this.logger
    );
  }

}
