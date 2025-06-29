import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { MailService } from 'src/mail/mail.service';
import { BannerRepository } from '../banners/utils/banner.repository';
import { handleRequest } from 'src/common/utils/hadle-request/handle-request';

jest.mock('src/common/utils/hadle-request/handle-request');

describe('NotificationsService', () => {
  let service: NotificationsService;
  let bannerRepo: jest.Mocked<BannerRepository>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: BannerRepository,
          useValue: {
            getExpiringInDays: jest.fn(),
            markNotified: jest.fn(),
            getExpiredBefore: jest.fn(),
            deleteById: jest.fn(),
            getPendingAutoRenewal: jest.fn(),
            updateRenewalDate: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendBannerExpirationWarning: jest.fn(),
            sendBannerExpiredNotification: jest.fn(),
            sendBannerAutomaticRenovationNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    bannerRepo = module.get(BannerRepository);
    mailService = module.get(MailService);
    jest.clearAllMocks();
  });

  describe('notifyExpiringBanners', () => {
    it('should notify users and mark banners as notified', async () => {
      const banner = {
        id: '1',
        user: { email: 'test@example.com' },
        destination_link: 'http://example.com',
      } as any;

      (handleRequest as jest.Mock).mockImplementation(fn => fn());
      bannerRepo.getExpiringInDays.mockResolvedValue([banner]);

      await service.notifyExpiringBanners();

      expect(mailService.sendBannerExpirationWarning).toHaveBeenCalledWith(
        banner.user.email,
        banner.destination_link,
        3,
      );
      expect(bannerRepo.markNotified).toHaveBeenCalledWith(banner.id);
    });

    it('should skip banner with no email', async () => {
      const banner = {
        id: '1',
        user: {},
        destination_link: 'http://example.com',
      } as any;

      (handleRequest as jest.Mock).mockImplementation(fn => fn());
      bannerRepo.getExpiringInDays.mockResolvedValue([banner]);

      await service.notifyExpiringBanners();

      expect(mailService.sendBannerExpirationWarning).not.toHaveBeenCalled();
    });
  });

  describe('deleteExpiredBanners', () => {
    it('should delete and notify for expired banners', async () => {
      const banner = {
        id: '1',
        user: { email: 'expired@example.com' },
        destination_link: 'http://expired.com',
      } as any;

      (handleRequest as jest.Mock).mockImplementation(fn => fn());
      bannerRepo.getExpiredBefore.mockResolvedValue([banner]);

      await service.deleteExpiredBanners();

      expect(bannerRepo.deleteById).toHaveBeenCalledWith(banner.id);
      expect(mailService.sendBannerExpiredNotification).toHaveBeenCalledWith(
        banner.user.email,
        banner.destination_link,
      );
    });
  });

  describe('notifyAutomaticRenewal', () => {
    it('should notify for auto-renewal and update renewal date if expired', async () => {
      const banner = {
        id: '1',
        user: { email: 'auto@example.com' },
        destination_link: 'http://auto.com',
        start_date: new Date('2023-01-01'),
        renewal_period: 30,
      } as any;

      (handleRequest as jest.Mock).mockImplementation(fn => fn());
      bannerRepo.getPendingAutoRenewal.mockResolvedValue([banner]);

      await service.notifyAutomaticRenewal();

      expect(mailService.sendBannerAutomaticRenovationNotification).toHaveBeenCalledWith(
        banner.user.email,
        banner.destination_link,
      );
      expect(bannerRepo.updateRenewalDate).toHaveBeenCalled();
    });

    it('should skip banners without renewal_period', async () => {
      const banner = {
        id: '2',
        user: { email: 'no-renew@example.com' },
        destination_link: 'http://no-renew.com',
        start_date: new Date(),
        renewal_period: null,
      } as any;

      (handleRequest as jest.Mock).mockImplementation(fn => fn());
      bannerRepo.getPendingAutoRenewal.mockResolvedValue([banner]);

      await service.notifyAutomaticRenewal();

      expect(mailService.sendBannerAutomaticRenovationNotification).not.toHaveBeenCalled();
      expect(bannerRepo.updateRenewalDate).not.toHaveBeenCalled();
    });
  });
});
