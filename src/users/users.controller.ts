import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdentifierDto } from 'src/users/dto/user-identifier.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import swaggerDecorators from './decorators/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Auth(ValidRoles.admin)
  @swaggerDecorators.ApiCreateUser()
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: UserWithRoles) {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @Auth(ValidRoles.admin)
  @swaggerDecorators.ApiGetUser()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }


  @Get(':term')
  @Auth(ValidRoles.admin)
  @swaggerDecorators.ApiGetUserByTerm()
  findOne(@Param() dto: UserIdentifierDto) {
    return this.usersService.findOne(dto.term);
  }

  // self-update
  @Patch()
  @Auth(ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user)
  @swaggerDecorators.ApiUpdateUser()
  updateSelf(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() userWithRoles: UserWithRoles,
  ) {
    return this.usersService.update(updateUserDto, userWithRoles);
  }

  // admin-update others
  @Patch(':term')
  @Auth(ValidRoles.admin)
  @swaggerDecorators.ApiUpdateUser()
  updateOther(
    @Param() identifierDto: UserIdentifierDto,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() userWithRoles: UserWithRoles,
  ) {
    return this.usersService.update(updateUserDto, userWithRoles, identifierDto.term);
  }

  // self-delete
  @Delete()
  @Auth(ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user)
  @swaggerDecorators.ApiDeleteUser()
  removeSelf(@GetUser() userWithRoles: UserWithRoles) {
    return this.usersService.remove(userWithRoles);
  }

  // admin-delete others
  @Delete(':term')
  @Auth(ValidRoles.admin)
  @swaggerDecorators.ApiDeleteUser()
  removeOther(
    @Param() identifierDto: UserIdentifierDto,
    @GetUser() userWithRoles: UserWithRoles,
  ) {
    return this.usersService.remove(userWithRoles, identifierDto.term);
  }

}
