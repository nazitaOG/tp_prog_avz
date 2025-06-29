import { Injectable, Logger } from '@nestjs/common';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import { handleRequest } from '../common/utils/hadle-request/handle-request';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    private async sendMailWithCheck(options: ISendMailOptions): Promise<any> {
        const info = await handleRequest(
            () => this.mailerService.sendMail(options),
            `Error enviando mail a ${options.to}`,
            this.logger,
        );

        if (info?.rejected?.length) {
            const rejected = info.rejected.join(', ');
            this.logger.warn(`SMTP rechazó el email a ${options.to}: ${rejected}`);
            throw new Error(`Mail rechazado a ${options.to}: ${rejected}`);
        }

        return info;
    }

    sendBannerExpirationWarning(email: string, link: string, daysLeft: number) {
        return this.sendMailWithCheck({
            to: email,
            subject: 'Aviso: tu banner está por expirar',
            template: 'banner-expiration',
            context: { email, link, daysLeft },
        });
    }

    sendBannerExpiredNotification(email: string, link: string) {
        return this.sendMailWithCheck({
            to: email,
            subject: 'Aviso: tu banner ha expirado',
            template: 'banner-expired',
            context: { email, link },
        });
    }

    sendBannerAutomaticRenovationNotification(email: string, link: string) {
        return this.sendMailWithCheck({
            to: email,
            subject: 'Aviso: tu banner está por renovarse',
            template: 'banner-automatic-renovation',
            context: { email, link },
        });
    }
}
