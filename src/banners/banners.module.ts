import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BannerValidator } from './validations/banner.validator';
import { FilesModule } from 'src/files/files.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [BannersController],
  providers: [BannersService, BannerValidator],
  imports: [PrismaModule, FilesModule, AuthModule],
})
export class BannersModule {}
