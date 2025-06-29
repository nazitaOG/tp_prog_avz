import { Test, TestingModule } from '@nestjs/testing';
import { MailerConfigModule } from './mailer.module';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

describe('MailerConfigModule', () => {
    let module: TestingModule;
    let mailService: MailService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            SMTP_HOST: 'smtp.example.com',
                            SMTP_PORT: '587',
                            SMTP_USER: 'user@example.com',
                            SMTP_PASS: 'secret',
                        }),
                    ],
                }),
                MailerConfigModule,
            ],
        }).compile();

        mailService = module.get<MailService>(MailService);
    });

    it('should define MailService', () => {
        expect(mailService).toBeDefined();
    });

});
