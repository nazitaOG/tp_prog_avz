import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdentifierDto } from 'src/users/dto/user-identifier.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserWithRoles } from 'src/prisma/interfaces/user-with-role.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Auth(ValidRoles.admin)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: UserWithRoles) {
    return this.usersService.create(createUserDto, user);
  }

  @Get()
  @Auth(ValidRoles.admin)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }


  @Get(':term')
  @Auth(ValidRoles.admin)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(@Param() dto: UserIdentifierDto) {
    return this.usersService.findOne(dto.term);
  }


  @Patch(':term')
  @Auth(ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  update(@Param() identifierDto: UserIdentifierDto, @Body() updateUserDto: UpdateUserDto, @GetUser() user: UserWithRoles) {
    return this.usersService.update(identifierDto.term, updateUserDto, user);
  }

  @Delete(':term')
  @Auth(ValidRoles.admin, ValidRoles.advertiser, ValidRoles.user)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(@Param() identifierDto: UserIdentifierDto, @GetUser() user: UserWithRoles) {
    return this.usersService.remove(identifierDto.term, user);
  }
}
