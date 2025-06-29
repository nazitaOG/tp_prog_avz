import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { BannerValidator } from './validations/banner.validator';
import { FilesModule } from 'src/files/files.module';
import { AuthModule } from 'src/auth/auth.module';
import { BannerRepository } from './utils/banner.repository';

@Module({
  controllers: [BannersController],
  providers: [BannersService, BannerValidator, BannerRepository],
  imports: [PrismaModule, FilesModule, AuthModule],
  exports: [BannerRepository],
})
export class BannersModule {}
