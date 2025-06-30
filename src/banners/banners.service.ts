import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { handleRequest } from 'src/common/utils/hadle-request/handle-request';
import { BannerValidator } from './validations/banner.validator';
import { FilesService } from 'src/files/files.service';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: BannerValidator,
    private readonly filesService: FilesService
  ) { }

  async create(
    body: CreateBannerDto,
    file: Express.Multer.File,
    user: UserWithRoles,
  ) {
    return handleRequest(async () => {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      const { secure_url, public_id } = await this.filesService.uploadImage(file);

      try {
        const validData = await this.validator.validateCreate(body, user, secure_url);
        return await this.prisma.banner.create({ data: validData });
      } catch (err) {
        if (public_id) {
          await this.filesService.deleteImage(public_id);
        }
        throw err;
      }
    }, 'Failed to create banner', this.logger);
  }

  findAll(paginationDto: PaginationDto) {
    return handleRequest(async () => {
      const { limit = 10, offset = 0 } = paginationDto;
      return this.prisma.banner.findMany({
        skip: offset,
        take: limit,
        include: {
          user: true,
          position: true,
        },
      });
    }, 'Failed to get banners', this.logger);
  }

  async findAllActive() {
    return handleRequest(async () => {
      const today = new Date();
      return this.prisma.banner.findMany({
        where: {
          start_date: { lte: today },
          AND: [
            {
              OR: [
                { end_date: null },
                { end_date: { gte: today } },
              ],
            },
          ],
        }
      });
    }, 'Failed to get active banners', this.logger);
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

  async update(
    id: string,
    body: UpdateBannerDto,
    user: UserWithRoles,
    file?: Express.Multer.File,
  ) {
    return handleRequest(async () => {

      if (!file && Object.keys(body).length === 0) {
        throw new BadRequestException(
          'You must provide at least one field or an image to update.'
        );
      }
      // if file, upload and save secure_url + public_id for rollback
      let secure_url: string | undefined;
      let public_id: string | undefined;
      if (file) {
        const upload = await this.filesService.uploadImage(file);
        secure_url = upload.secure_url;
        public_id = upload.public_id;
      }

      try {
        const validData = await this.validator.validateUpdate(body, id, user, secure_url);
        return await this.prisma.banner.update({
          where: { id },
          data: validData
        });
      } catch (err) {
        // rollback image if upload failed
        if (public_id) {
          await this.filesService.deleteImage(public_id);
        }
        throw err;
      }
    }, 'Failed to update banner', this.logger);
  }


  remove(id: string, user: UserWithRoles) {
    return handleRequest(async () => {
      const banner = await this.prisma.banner.findUnique({
        where: { id },
      });
      if (!banner) {
        throw new NotFoundException(`Banner ${id} not found`);
      }

      if (banner.user_id !== user.id && !user.roles.some(role => role.role_id === ValidRoles.admin)) {
        throw new BadRequestException('You are not authorized to delete this banner');
      }

      return await this.prisma.banner.delete({ where: { id } });
    }, 'Failed to delete banner', this.logger);
  }
}
