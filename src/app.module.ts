import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { BannersModule } from './banners/banners.module';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({}),
    PrismaModule,
    AuthModule,
    UsersModule,
    BannersModule,
    CommonModule,
    BannersModule,
    FilesModule,
  ],
})
export class AppModule {}
