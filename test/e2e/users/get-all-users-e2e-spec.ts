import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

const newUser = {
    email: `test+${Date.now()}@example.com`,
    password: 'Test123!',
    name: 'Test User',
};
const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123',
};

describe('UsersModule Get All Users (e2e)', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;
    let userId: string;

    beforeAll(async () => {
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

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });

        const resReg = await request(app.getHttpServer())
            .post('/auth/register')
            .send(newUser);
        expect(resReg.status).toBe(HttpStatus.CREATED);
        userId = resReg.body.user.id;

        const resUserLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: newUser.email, password: newUser.password });
        expect(resUserLogin.status).toBe(HttpStatus.CREATED);
        userToken = resUserLogin.body.token;

        const resAdminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send(adminCredentials);
        expect(resAdminLogin.status).toBe(HttpStatus.CREATED);
        adminToken = resAdminLogin.body.token;
    });

    afterAll(async () => {
        await request(app.getHttpServer())
            .delete(`/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(HttpStatus.OK);

        await app.close();
    });

    it('GET /users – no token – 401', async () => {
        const res = await request(app.getHttpServer()).get('/users');
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toContain('Unauthorized');
    });

    it('GET /users – user token – 403', async () => {
        const res = await request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toMatch(/^User .+ does not have the required role: 1$/);
    });

    it('GET /users – admin token – 200', async () => {
        const res = await request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.OK);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /users?limit=1&offset=0 – admin token – paginated results', async () => {
        const res = await request(app.getHttpServer())
            .get('/users?limit=1&offset=0')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.OK);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
    });
});
