import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { handleRequest } from '../common/utils/hadle-request/handle-request';

jest.mock('../common/utils/hadle-request/handle-request');

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  const mockSendMail = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: mockSendMail,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMailWithCheck', () => {
    const email = 'test@example.com';

    it('should call handleRequest and not throw when accepted', async () => {
      (handleRequest as jest.Mock).mockResolvedValue({ rejected: [] });

      const result = await (service as any).sendMailWithCheck({
        to: email,
        subject: 'Test',
        template: 'template',
        context: {},
      });

      expect(handleRequest).toHaveBeenCalled();
      expect(result.rejected).toHaveLength(0);
    });

    it('should throw if email is rejected', async () => {
      (handleRequest as jest.Mock).mockResolvedValue({
        rejected: ['test@example.com'],
      });

      await expect(
        (service as any).sendMailWithCheck({
          to: email,
          subject: 'Test',
          template: 'template',
          context: {},
        }),
      ).rejects.toThrow(`Mail rechazado a ${email}: test@example.com`);
    });
  });

  describe('sendBannerExpirationWarning', () => {
    it('should call sendMailWithCheck with correct data', async () => {
      const spy = jest.spyOn<any, any>(service, 'sendMailWithCheck').mockResolvedValue('ok');

      await service.sendBannerExpirationWarning('user@mail.com', 'http://test.link', 3);

      expect(spy).toHaveBeenCalledWith({
        to: 'user@mail.com',
        subject: 'Aviso: tu banner está por expirar',
        template: 'banner-expiration',
        context: {
          email: 'user@mail.com',
          link: 'http://test.link',
          daysLeft: 3,
        },
      });
    });
  });

  describe('sendBannerExpiredNotification', () => {
    it('should call sendMailWithCheck with correct data', async () => {
      const spy = jest.spyOn<any, any>(service, 'sendMailWithCheck').mockResolvedValue('ok');

      await service.sendBannerExpiredNotification('user@mail.com', 'http://test.link');

      expect(spy).toHaveBeenCalledWith({
        to: 'user@mail.com',
        subject: 'Aviso: tu banner ha expirado',
        template: 'banner-expired',
        context: {
          email: 'user@mail.com',
          link: 'http://test.link',
        },
      });
    });
  });

  describe('sendBannerAutomaticRenovationNotification', () => {
    it('should call sendMailWithCheck with correct data', async () => {
      const spy = jest.spyOn<any, any>(service, 'sendMailWithCheck').mockResolvedValue('ok');

      await service.sendBannerAutomaticRenovationNotification('user@mail.com', 'http://test.link');

      expect(spy).toHaveBeenCalledWith({
        to: 'user@mail.com',
        subject: 'Aviso: tu banner está por renovarse',
        template: 'banner-automatic-renovation',
        context: {
          email: 'user@mail.com',
          link: 'http://test.link',
        },
      });
    });
  });
});
