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

describe('UsersModule Get User By Term (e2e)', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;
    let userId: string;

    beforeAll(async () => {
        const mod: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = mod.createNestApplication();
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

        const resLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: newUser.email, password: newUser.password });
        expect(resLogin.status).toBe(HttpStatus.CREATED);
        userToken = resLogin.body.token;

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
        const res = await request(app.getHttpServer()).get('/users/');
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toContain('Unauthorized');
    });

    it('GET /users/:term – without token – 401', async () => {
        const res = await request(app.getHttpServer()).get(`/users/${newUser.email}`);
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toContain('Unauthorized');
    });

    it('GET /users/:term – user token – 403', async () => {
        const res = await request(app.getHttpServer())
            .get(`/users/${newUser.email}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toMatch(/^User .+ does not have the required role: 1$/);
    });

    it('GET /users/:term – admin by email – 200', async () => {
        const res = await request(app.getHttpServer())
            .get(`/users/${newUser.email}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.id).toBe(userId);
        expect(res.body.email).toBe(newUser.email.toLowerCase());
    });

    it('GET /users/:term – admin by id – 200', async () => {
        const res = await request(app.getHttpServer())
            .get(`/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.id).toBe(userId);
    });

    it('GET /users/:term – non-existent term – 404', async () => {
        const fakeId = `${userId.slice(0, 8)}-notfound`;
        const res = await request(app.getHttpServer())
            .get(`/users/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.NOT_FOUND);
        expect(res.body.message).toContain('Failed to find user');
    });
});
