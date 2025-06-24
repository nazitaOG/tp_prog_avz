import {
  Controller, Post, UseInterceptors, UploadedFile,
  Body, BadRequestException, ParseUUIDPipe, Patch, Param, Get, Delete
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBannerRequestDto } from './dto/create-banner-request.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannersService } from './banners.service';
import { FilesService } from 'src/files/files.service';
import { fileFilter } from 'src/files/helpers/fileFilter.helper';

@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    private readonly filesService: FilesService,
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async createBanner(
    @UploadedFile() file: Express.Multer.File,
    @Body() reqDto: CreateBannerRequestDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.bannersService.create(reqDto, file);
  }

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async updateBanner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file && Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'You must provide at least one field or an image to update.'
      );
    }
    return this.bannersService.update(id, dto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.remove(id);
  }
}
