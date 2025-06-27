import {
  Controller, Post, UseInterceptors, UploadedFile,
  Body, BadRequestException, ParseUUIDPipe, Patch, Param, Get, Delete, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannersService } from './banners.service';
import { fileFilter } from 'src/files/helpers/fileFilter.helper';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UserWithRoles } from 'src/prisma/interfaces/user-with-role.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
  ) { }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: {
    type: 'object',
    properties: {
      destination_link: {
        type: 'string',
        format: 'url',
        description: 'The destination link of the banner',
        example: 'https://www.google.com',
      },
      start_date: {
        type: 'string',
        format: 'date',
        description: 'The start date of the banner (YYYY-MM-DD) default',
        default: new Date(),
        example: '',
      },
      end_date: {
        type: 'string',
        format: 'date',
        description: 'The end date of the banner (YYYY-MM-DD) default',
        default: null,
        example: '',
      },
      position_id: {
        type: 'number',
        enum: [1, 2, 3, 4],
        description: 'The position id of the banner (1, 2, 3, 4)',
        example: 1,
      },
      renewal_strategy: {
        type: 'string',
        enum: ['automatic', 'manual'],
        description: 'The renewal strategy of the banner (automatic or manual)',
        default: 'manual',
        example: 'manual',
      },
      renewal_period: {
        type: 'number',
        enum: [30, 60, 90],
        description: 'The renewal period of the banner (30, 60, 90) default',
        example:''
      },
      file: {
        type: 'string',
        format: 'binary',
        description: 'The image file of the banner',
      },
    },
    required: ['destination_link', 'position_id', 'renewal_strategy', 'file'],
  } })
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async createBanner(
    @UploadedFile() file: Express.Multer.File,
    @Body() reqDto: CreateBannerDto,
    @GetUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.bannersService.create(reqDto, file, user);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Banners fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.bannersService.findAll(paginationDto);
  }


  @Get(':id')
  @ApiResponse({ status: 200, description: 'Banner fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Banner updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async updateBanner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
    @GetUser() user: UserWithRoles,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bannersService.update(id, dto, user, file);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Banner deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
    remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: UserWithRoles) {
    return this.bannersService.remove(id, user);
  }
}
