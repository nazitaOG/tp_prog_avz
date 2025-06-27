import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { handleRequest } from 'src/utils/hadle-request/handle-request';
import { BannerValidator } from './validations/banner.validator';
import { FilesService } from 'src/files/files.service';
import { Prisma, User } from '@prisma/client';
import { UserWithRoles } from 'src/prisma/interfaces/user-with-role.interface';
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
    user: User,
  ) {
    return handleRequest(async () => {
      if (!file) throw new BadRequestException('Image file is required');

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

  /////retocar esta madrepara que quede mas limpio

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
      // 1) Si viene file, subo y guardo secure_url + public_id para rollback
      let secure_url: string | undefined;
      let public_id: string | undefined;
      if (file) {
        const upload = await this.filesService.uploadImage(file);
        secure_url = upload.secure_url;
        public_id = upload.public_id;
      }

      try {
        // 3) Validaciones de negocio
        const validData = await this.validator.validateUpdate(body, id, user, secure_url);

        // 4) Preparo el objeto para Prisma:
        //    convierto position_id en nested connect, si viene
        const dataForPrisma: any = { ...validData };
        if (validData.position_id != null) {
          dataForPrisma.position = { connect: { id: validData.position_id } };
          delete dataForPrisma.position_id;
        }

        // 5) Ejecuto el update
        return await this.prisma.banner.update({
          where: { id },
          data: dataForPrisma as Prisma.BannerUpdateInput,
        });
      } catch (err) {
        // 6) Si falló y hubo subida, hago rollback de la imagen
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
