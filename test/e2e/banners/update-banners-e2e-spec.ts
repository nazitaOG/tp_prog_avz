// test/e2e/banners/update-banners-e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
    INestApplication,
    ValidationPipe,
    HttpStatus,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FilesService } from 'src/files/files.service';

describe('BannersModule Update Banner (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let filesSvc: FilesService;
    let advToken: string;
    let adminToken: string;
    let advBannerId: string;
    let adminBannerId: string;

    beforeAll(async () => {
        // Silenciar Logger
        jest
            .spyOn(require('@nestjs/common').Logger.prototype, 'log')
            .mockImplementation(() => { });
        jest
            .spyOn(require('@nestjs/common').Logger.prototype, 'error')
            .mockImplementation(() => { });
        jest
            .spyOn(require('@nestjs/common').Logger.prototype, 'warn')
            .mockImplementation(() => { });

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(FilesService)
            .useValue({
                uploadImage: jest.fn().mockResolvedValue({
                    secure_url: 'http://new.img',
                    public_id: 'pub123',
                }),
                deleteImage: jest.fn(),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        prisma = app.get(PrismaService);
        filesSvc = app.get(FilesService);

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();

        // Login advertiser
        {
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'advertiser@example.com', password: 'advertiser123' });
            advToken = res.body.token;
        }

        // Login admin
        {
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'admin@example.com', password: 'admin123' });
            adminToken = res.body.token;
        }

        // Crear banner del advertiser para pruebas
        const advUser = await prisma.user.findFirst({
            where: { email: 'advertiser@example.com' },
        });
        if (!advUser) throw new Error('Advertiser user not found');
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        const advBanner = await prisma.banner.create({
            data: {
                image_url: 'http://orig.img',
                destination_link: 'http://orig.example',
                start_date: now,
                end_date: tomorrow,
                renewal_strategy: 'manual',
                user_id: advUser.id,
                position_id: 4,     // lateral_derecho (max_banners=3)
                display_order: 1,
            },
        });
        advBannerId = advBanner.id;

        // Tomar un banner creado por el admin en el seed
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@example.com' },
        });
        if (!adminUser) throw new Error('Admin user not found');
        const adminBanner = await prisma.banner.findFirst({
            where: { user_id: adminUser.id },
        });
        if (!adminBanner) throw new Error('Admin banner not found');
        adminBannerId = adminBanner.id;
    });

    afterAll(async () => {
        // Limpiar banner del advertiser
        await prisma.banner.delete({ where: { id: advBannerId } });
        await app.close();
    });

    it('PATCH /banners/:id – sin token → 401', async () => {
        await request(app.getHttpServer())
            .patch(`/banners/${advBannerId}`)
            .send({ destination_link: 'x' })
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('PATCH /banners/:id – user role → 403', async () => {
        const resUser = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user@example.com', password: 'user123' });
        const userToken = resUser.body.token;

        await request(app.getHttpServer())
            .patch(`/banners/${advBannerId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ destination_link: 'x' })
            .expect(HttpStatus.FORBIDDEN);
    });

    it('PATCH /banners/:id – advertiser sin body ni file → 400', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/banners/${advBannerId}`)
            .set('Authorization', `Bearer ${advToken}`)
            .send({});
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain(
            'You must provide at least one field to update.',
        );
    });

    it('PATCH /banners/:id – advertiser actualiza propio → 200', async () => {
        const newLink = 'https://updated.example';
        const res = await request(app.getHttpServer())
            .patch(`/banners/${advBannerId}`)
            .set('Authorization', `Bearer ${advToken}`)
            .send({
                destination_link: newLink,
                display_order: 1,  // necesario para posiciones con max_banners>1
            });
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.destination_link).toBe(newLink);
    });

    it('PATCH /banners/:id – advertiser no puede actualizar otro → 400', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/banners/${adminBannerId}`)
            .set('Authorization', `Bearer ${advToken}`)
            .send({
                destination_link: 'https://foo.com',
                display_order: 1,
            });
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toBe(
            'You are not authorized to update this banner',
        );
    });

    it('PATCH /banners/:id – admin actualiza con file y body → 200', async () => {
        const res = await request(app.getHttpServer())
            .patch(`/banners/${advBannerId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('file', Buffer.from('img'), 'update.png')
            .field('destination_link', 'https://admin.updated')
            .field('display_order', '2');
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.destination_link).toBe('https://admin.updated');
        expect(res.body.image_url).toBe('http://new.img');
        expect((filesSvc.uploadImage as jest.Mock).mock.calls.length).toBe(1);
        expect((filesSvc.deleteImage as jest.Mock).mock.calls.length).toBe(0);
    });

    it('PATCH /banners/:id – admin id no válido → 400/404', async () => {
        await request(app.getHttpServer())
            .patch('/banners/not-a-uuid')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ destination_link: 'x' })
            .expect(HttpStatus.BAD_REQUEST);

        await request(app.getHttpServer())
            .patch('/banners/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ destination_link: 'x' })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('PATCH /banners/:id – admin invalid DTO limpia imagen → 400', async () => {
        (filesSvc.uploadImage as jest.Mock).mockResolvedValue({
            secure_url: 'http://fail.img',
            public_id: 'to-delete',
        });
        (filesSvc.deleteImage as jest.Mock).mockClear();

        const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const res = await request(app.getHttpServer())
            .patch(`/banners/${advBannerId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('file', Buffer.from('img'), 'f.png')
            .field('end_date', yesterday)
            .field('display_order', '2');

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(
            (filesSvc.deleteImage as jest.Mock).mock.calls.some(
                (call) => call[0] === 'to-delete',
            ),
        ).toBe(true);
    });
});
