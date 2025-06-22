import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleRequest } from 'src/utils/handle-request';
import { BannerValidator } from './validations/banner.validator';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: BannerValidator
  ) {}

  async create(dto: CreateBannerDto) {
    return handleRequest(async () => {
      const validData = await this.validator.validateCreate(dto);
      return this.prisma.banner.create({ data: validData });
    }, 'Failed to create banner', this.logger);
  }

  findAll() {
    return handleRequest(async () => {
      return this.prisma.banner.findMany({
        include: {
          user: true,
          position: true,
        },
      });
    }, 'Failed to get banners', this.logger);
  }

  findOne(id: string) {
    return handleRequest(async () => {
      const banner = await this.prisma.banner.findUnique({ where: { id } });
      if (!banner) {
        this.logger.error(`Banner ${id} not found`);
        throw new NotFoundException('Banner not found');
      }
      return banner;
    }, 'Failed to get banner');
  }

  async update(id: string, dto: UpdateBannerDto) {
    return handleRequest(async () => {
      const validData = await this.validator.validateUpdate(dto, id);
      return this.prisma.banner.update({ where: { id }, data: validData });
    }, 'Failed to update banner', this.logger);
  }

  remove(id: string) {
    return handleRequest(() =>
      this.prisma.banner.delete({ where: { id } }),
      'Failed to delete banner',
      this.logger
    );
  }
}
