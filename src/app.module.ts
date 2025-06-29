import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { BannersModule } from './banners/banners.module';
import { FilesModule } from './files/files.module';
import { UsersModule } from './users/users.module';
import { NotificationsService } from './notifications/notifications.service';
import { MailService } from './mail/mail.service';
import { MailerConfigModule } from './mail/mailer.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({}),
    ScheduleModule.forRoot(),
    MailerConfigModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    BannersModule,
    CommonModule,
    BannersModule,
    FilesModule,
  ],
  providers: [NotificationsService, MailService],
})
export class AppModule {}
