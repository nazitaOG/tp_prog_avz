// scripts/trigger-notifications.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NotificationsService } from '../notifications.service';

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const svc = app.get(NotificationsService);

    console.log('→ Enviando warnings de expiración...');
    await svc.notifyExpiringBanners();

    console.log('→ Borrando expirados y notificando...');
    await svc.deleteExpiredBanners();

    console.log('→ Notificando renovaciones automáticas...');
    await svc.notifyAutomaticRenewal();

    await app.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
