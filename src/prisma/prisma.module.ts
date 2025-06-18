import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [
        PrismaService,
        {
            provide: 'DATABASE_URL',
            useFactory: (config: ConfigService) => {
            const user = config.get('DB_USER');
            const password = config.get('DB_PASSWORD');
            const host = config.get('DB_HOST');
            const port = config.get('DB_PORT');
            const database = config.get('DB_NAME');
    
            return `postgresql://${user}:${password}@${host}:${port}/${database}`;
            },
            inject: [ConfigService],
        },
    ],
    exports: [PrismaService],
    
})
export class PrismaModule { } 