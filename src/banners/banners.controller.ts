import { Controller, Post, UseInterceptors, UploadedFile, Body, ParseUUIDPipe, Patch, Param, Get, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannersService } from './banners.service';
import { fileFilter } from 'src/files/helpers/fileFilter.helper';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import swaggerDecorators from './decorators/swagger';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
  ) { }

  @Post()
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  @swaggerDecorators.ApiCreateBanner()
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async createBanner(@UploadedFile() file: Express.Multer.File, @Body() reqDto: CreateBannerDto, @GetUser() user: UserWithRoles) {
    return this.bannersService.create(reqDto, file, user);
  }

  @Get()
  @swaggerDecorators.ApiGetAllBanners()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.bannersService.findAll(paginationDto);
  }

  @Get('active')
  @swaggerDecorators.ApiGetAllActiveBanners()
  findAllActive() {
    return this.bannersService.findAllActive();
  }

  @Get(':id')
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  @swaggerDecorators.ApiGetBannerById()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  @swaggerDecorators.ApiUpdateBanner()
  @UseInterceptors(FileInterceptor('file', { fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async updateBanner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto, @GetUser() user: UserWithRoles, @UploadedFile() file?: Express.Multer.File) {
    return this.bannersService.update(id, dto, user, file);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.advertiser)
  @swaggerDecorators.ApiDeleteBanner()
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: UserWithRoles) {
    return this.bannersService.remove(id, user);
  }
}
