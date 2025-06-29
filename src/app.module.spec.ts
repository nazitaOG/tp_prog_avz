import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { NotificationsService } from './notifications/notifications.service';
import { MailService } from './mail/mail.service';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { BannersService } from './banners/banners.service';

describe('AppModule', () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
    });

    it('should resolve PrismaService', () => {
        const service = moduleRef.get(PrismaService);
        expect(service).toBeDefined();
    });

    it('should resolve NotificationsService', () => {
        const service = moduleRef.get(NotificationsService);
        expect(service).toBeDefined();
    });

    it('should resolve MailService', () => {
        const service = moduleRef.get(MailService);
        expect(service).toBeDefined();
    });

    it('should resolve AuthService', () => {
        const service = moduleRef.get(AuthService);
        expect(service).toBeDefined();
    });

    it('should resolve UsersService', () => {
        const service = moduleRef.get(UsersService);
        expect(service).toBeDefined();
    });

    it('should resolve BannersService', () => {
        const service = moduleRef.get(BannersService);
        expect(service).toBeDefined();
    });
});
