import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { FilesService } from 'src/files/files.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

describe('BannersModule Create (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;
    let advToken: string;
    let prisma: PrismaService;
    const bannerDto = {
        destination_link: 'https://example.com',
        position_id: 4, // lateral_derecho (max_banners=3)
        renewal_strategy: 'manual',
        display_order: 1,
    };
    const createdIds: string[] = [];

    beforeAll(async () => {
        // Silenciar todo Logger para que no imprima nada en consola
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
                uploadImage: jest
                    .fn()
                    .mockResolvedValue({ secure_url: 'http://img.url', public_id: 'pub123' }),
                deleteImage: jest.fn(),
            })
            .compile();

        app = moduleFixture.createNestApplication();
        prisma = app.get(PrismaService);
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();

        // login admin
        const resAdmin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@example.com', password: 'admin123' });
        adminToken = resAdmin.body.token;

        // login advertiser
        const resAdv = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'advertiser@example.com', password: 'advertiser123' });
        advToken = resAdv.body.token;
    });

    afterAll(async () => {
        // cleanup created banners
        await Promise.all(
            createdIds.map(id => prisma.banner.delete({ where: { id } })),
        );
        await app.close();
    });

    it('POST /banners - without token → 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/banners')
            .send(bannerDto);
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('POST /banners - user role → 403', async () => {
        const resUser = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user@example.com', password: 'user123' });
        const token = resUser.body.token;

        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
            .post('/banners')
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from('fake'), 'banner.png')
            .field('destination_link', bannerDto.destination_link)
            .field('position_id', String(bannerDto.position_id))
            .field('renewal_strategy', bannerDto.renewal_strategy)
            .field('display_order', String(bannerDto.display_order))
            .field('end_date', tomorrow);

        expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('POST /banners - admin missing file → 400', async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
            .post('/banners')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('destination_link', bannerDto.destination_link)
            .field('position_id', String(bannerDto.position_id))
            .field('renewal_strategy', bannerDto.renewal_strategy)
            .field('display_order', String(bannerDto.display_order))
            .field('end_date', tomorrow);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('Image file is required');
    });

    it('POST /banners - advertiser with file → 201', async () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const res = await request(app.getHttpServer())
            .post('/banners')
            .set('Authorization', `Bearer ${advToken}`)
            .attach('file', Buffer.from('fake'), 'banner.png')
            .field('destination_link', bannerDto.destination_link)
            .field('position_id', String(bannerDto.position_id))
            .field('renewal_strategy', bannerDto.renewal_strategy)
            .field('display_order', String(bannerDto.display_order))
            .field('end_date', tomorrow);

        expect(res.status).toBe(HttpStatus.CREATED);
        expect(res.body).toHaveProperty('id');
        expect(res.body.image_url).toBe('http://img.url');
        expect(res.body.destination_link).toBe(bannerDto.destination_link);
        expect(res.body.position_id).toBe(bannerDto.position_id);
        createdIds.push(res.body.id);
    });

    it('POST /banners - invalid DTO returns 400 and cleans up image', async () => {
        const filesSvc = app.get<FilesService>(FilesService);
        (filesSvc.deleteImage as jest.Mock).mockClear();
        (filesSvc.uploadImage as jest.Mock).mockResolvedValue({
            secure_url: 'url',
            public_id: 'to-delete',
        });

        // manual strategy without end_date → error de validación
        const res = await request(app.getHttpServer())
            .post('/banners')
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('file', Buffer.from('fake'), 'f.png')
            .field('destination_link', bannerDto.destination_link)
            .field('position_id', String(bannerDto.position_id))
            .field('renewal_strategy', 'manual')
            .field('display_order', String(bannerDto.display_order));

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        // comprobar que borró la imagen "to-delete"
        expect(
            (filesSvc.deleteImage as jest.Mock).mock.calls.some(
                call => call[0] === 'to-delete',
            ),
        ).toBe(true);
    });
});
