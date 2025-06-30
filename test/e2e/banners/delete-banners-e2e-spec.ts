import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('BannersModule Find All (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;
    let advToken: string;

    beforeAll(async () => {
        // silenciar todo Logger
        jest.spyOn(require('@nestjs/common').Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(require('@nestjs/common').Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(require('@nestjs/common').Logger.prototype, 'warn').mockImplementation(() => { });

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        await delay(200 + Math.random() * 600);

        // hacer login de admin y advertiser
        const resAdmin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@example.com', password: 'admin123' });
        adminToken = resAdmin.body.token;

        const resAdv = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'advertiser@example.com', password: 'advertiser123' });
        advToken = resAdv.body.token;
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /banners - default pagination returns array of banners', async () => {
        const res = await request(app.getHttpServer())
            .get('/banners')
            .expect(HttpStatus.OK);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toBeInstanceOf(Array);
        const banner = res.body[0];
        expect(banner).toHaveProperty('id');
        expect(banner).toHaveProperty('image_url');
        expect(banner).toHaveProperty('destination_link');
        expect(banner).toHaveProperty('start_date');
        expect(banner).toHaveProperty('renewal_strategy');
        expect(banner).toHaveProperty('user');
        expect(banner).toHaveProperty('position');
    });

    it('GET /banners?limit=1&offset=1 - pagination works', async () => {
        const resAll = await request(app.getHttpServer()).get('/banners');
        expect(resAll.status).toBe(HttpStatus.OK);
        expect(resAll.body.length).toBeGreaterThanOrEqual(2);

        const res = await request(app.getHttpServer())
            .get('/banners?limit=1&offset=1')
            .expect(HttpStatus.OK);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(resAll.body[1].id);
    });

    it('GET /banners with invalid pagination returns 400', async () => {
        const res = await request(app.getHttpServer())
            .get('/banners?limit=abc&offset=xyz')
            .expect(HttpStatus.BAD_REQUEST);

        expect(res.body.message).toEqual(
            expect.arrayContaining([
                expect.stringContaining('limit must be a number conforming to'),
                expect.stringContaining('offset must be a number conforming to'),
            ]),
        );
    });

    it('GET /banners/active - returns only currently active banners', async () => {
        const resAll = await request(app.getHttpServer()).get('/banners');
        const all = resAll.body;

        const resActive = await request(app.getHttpServer())
            .get('/banners/active')
            .expect(HttpStatus.OK);
        const active = resActive.body;

        const today = new Date();
        for (const b of active) {
            const start = new Date(b.start_date);
            const end = b.end_date ? new Date(b.end_date) : null;
            expect(start.getTime()).toBeLessThanOrEqual(today.getTime());
            if (end) expect(end.getTime()).toBeGreaterThanOrEqual(today.getTime());
            expect(all.map(x => x.id)).toContain(b.id);
        }
    });

    describe('GET /banners/:id (e2e)', () => {
        let sampleId: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer()).get('/banners');
            sampleId = res.body[0].id;
        });

        it('without token returns 401', async () => {
            await request(app.getHttpServer())
                .get(`/banners/${sampleId}`)
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('with user role returns 403', async () => {
            const resUser = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'user@example.com', password: 'user123' });
            const token = resUser.body.token;

            await request(app.getHttpServer())
                .get(`/banners/${sampleId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('with advertiser token returns 200', async () => {
            const res = await request(app.getHttpServer())
                .get(`/banners/${sampleId}`)
                .set('Authorization', `Bearer ${advToken}`)
                .expect(HttpStatus.OK);

            expect(res.body).toHaveProperty('id', sampleId);
            expect(res.body).toHaveProperty('image_url');
            expect(res.body).toHaveProperty('destination_link');
        });

        it('with admin token returns 200', async () => {
            const res = await request(app.getHttpServer())
                .get(`/banners/${sampleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(HttpStatus.OK);
            expect(res.body.id).toBe(sampleId);
        });

        it('invalid id returns 404', async () => {
            await request(app.getHttpServer())
                .get('/banners/not-a-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(HttpStatus.BAD_REQUEST);

            await request(app.getHttpServer())
                .get('/banners/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });
    });
});
