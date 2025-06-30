import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BannerRepository } from '../banners/utils/banner.repository';
import { MailService } from 'src/mail/mail.service';
import { handleRequest } from 'src/common/utils/hadle-request/handle-request';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private static readonly DAILY = CronExpression.EVERY_DAY_AT_1AM; //EVERY 10 SECONDS METODO DE TESTEO

    constructor(
        private readonly bannerRepo: BannerRepository,
        private readonly mailService: MailService,
    ) { }

    @Cron(NotificationsService.DAILY)
    async notifyExpiringBanners() {
        return handleRequest(async () => {
            this.logger.log('Ejecutando revisión de banners por vencer');

            const banners = await this.bannerRepo.getExpiringInDays(3);
            for (const banner of banners) {
                const { user, destination_link, id } = banner;
                if (!user?.email) {
                    this.logger.warn(`Usuario sin email en banner ${id}`);
                    continue;
                }
                try {
                    await this.mailService.sendBannerExpirationWarning(
                        user.email,
                        destination_link,
                        3,
                    );
                    await this.bannerRepo.markNotified(id);
                    this.logger.log(`Aviso enviado a ${user.email}`);
                } catch (error) {
                    this.logger.error(
                        `Fallo al enviar aviso a ${user.email}`,
                        error instanceof Error ? error.stack : String(error),
                    );
                }
            }
        }, 'Fallo en notificaciones de banners por vencer', this.logger);
    }

    @Cron(NotificationsService.DAILY)
    async deleteExpiredBanners() {
        return handleRequest(
            async () => {
                this.logger.log('Eliminando banners vencidos');

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const expiredBanners = await this.bannerRepo.getExpiredBefore(today);
                for (const banner of expiredBanners) {
                    const { id, user, destination_link } = banner;
                    try {
                        await this.bannerRepo.deleteById(id);
                        await this.mailService.sendBannerExpiredNotification(
                            user.email,
                            destination_link,
                        );
                        this.logger.log(`Banner ${id} eliminado y notificado`);
                    } catch (error) {
                        this.logger.error(
                            `Error eliminando/notificando banner ${id}`,
                            error instanceof Error ? error.stack : String(error),
                        );
                    }
                }
                this.logger.log(`Eliminados ${expiredBanners.length} banners vencidos`);
            },
            'Error eliminando banners vencidos',
            this.logger,
        );
    }

    @Cron(NotificationsService.DAILY)
    async notifyAutomaticRenewal() {
        return handleRequest(
            async () => {
                this.logger.log('Notificando banners para renovación automática');

                const banners = await this.bannerRepo.getPendingAutoRenewal();
                for (const banner of banners) {
                    const { id, start_date, renewal_period, user, destination_link } = banner;
                    if (!renewal_period) continue;
                    try {
                        const renewalDate = new Date(start_date);
                        renewalDate.setDate(renewalDate.getDate() + renewal_period);
                        if (renewalDate < new Date()) {
                            await this.mailService.sendBannerAutomaticRenovationNotification(
                                user.email,
                                destination_link,
                            );
                            await this.bannerRepo.updateRenewalDate(id, renewalDate);
                        }
                    } catch (error) {
                        this.logger.error(
                            `Error en renovación automática banner ${id}`,
                            error instanceof Error ? error.stack : String(error),
                        );
                    }
                }
            },
            'Error en notificar renovación automática',
            this.logger,
        );
    }
}
