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
  constructor(private readonly usersService: UsersService) {}

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


  @Patch(':term')
  @Auth(ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user)
  @swaggerDecorators.ApiUpdateUser()
  update(@Param() identifierDto: UserIdentifierDto, @Body() updateUserDto: UpdateUserDto, @GetUser() user: UserWithRoles) {
    return this.usersService.update(identifierDto.term, updateUserDto, user);
  }

  @Delete(':term')
  @Auth(ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user)
  @swaggerDecorators.ApiDeleteUser()
  remove(@Param() identifierDto: UserIdentifierDto, @GetUser() user: UserWithRoles) {
    return this.usersService.remove(identifierDto.term, user);
  }
}
