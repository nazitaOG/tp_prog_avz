import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { BannersModule } from './banners/banners.module';
@Module({
  imports: [
    ConfigModule.forRoot({}),
    PrismaModule,
    UsersModule,
    BannersModule,
    CommonModule,
    BannersModule,
  ],
})
export class AppModule {}
