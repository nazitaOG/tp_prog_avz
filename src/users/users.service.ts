import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { handleRequest } from 'src/utils/hadle-request/handle-request';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

  private readonly logger = new Logger(UsersService.name);

  // Inject the PrismaService to use the prisma client
  constructor(private readonly prisma: PrismaService) { }


  create(createUserDto: CreateUserDto) {
    return handleRequest(async () => {

      const hashed_password = await bcrypt.hash(createUserDto.password, 10);

      const roles = createUserDto.roles?.length ? createUserDto.roles : ['user'];

      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
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

      return userWithoutPassword;

    }, 'Failed to create user', this.logger);
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return handleRequest(
      () => this.prisma.user.findMany({
        // Pagination using Prisma
        skip: offset,
        take: limit,

        include: {
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
      return user;
    },
      `Failed to find user`
    );
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return handleRequest(async () => {
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
  
      const { roles, ...rest } = updateUserDto;
  
      // First, update the basic user fields
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...rest,
          hashed_password: updateUserDto.password,
          ...(roles && {
            roles: {
              deleteMany: {}, // delate all current roles
              create: roles.map(roleName => ({
                role: { connect: { name: roleName } }
              })),
            }
          }),
        },
        include: { roles: true }, 
      });
  
      const { hashed_password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }, `Failed to update user`, this.logger);
  }
  


  remove(id: string) {
    const isId = isUUID(id);

    return handleRequest(
      () =>
        this.prisma.user.delete({
          where: isId ? { id } : { email: id },
        }),
      `Failed to delete user`,
      this.logger,
    );
  }
}
