import { INestApplication, Logger, ValidationPipe, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

const userCreds = {
    email: `e2euser+${Date.now()}@example.com`,
    password: 'User123!',
    name: 'E2E User',
};
const adminCreds = {
    email: 'admin@example.com',
    password: 'admin123',
};

describe('Auth E2E', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;
    let userId: string;

    beforeAll(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider('MailService')
            .useValue({
                sendBannerExpirationWarning: jest.fn(),
                sendBannerExpiredNotification: jest.fn(),
                sendBannerAutomaticRenovationNotification: jest.fn(),
            })
            .compile();

        app = moduleRef.createNestApplication();
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

        const resUserReg = await request(app.getHttpServer())
            .post('/auth/register')
            .send(userCreds);
        expect(resUserReg.status).toBe(HttpStatus.CREATED);
        userId = resUserReg.body.user.id;

        const resUserLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userCreds.email, password: userCreds.password });
        expect(resUserLogin.status).toBe(HttpStatus.CREATED);
        userToken = resUserLogin.body.token;

        const resAdminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: adminCreds.email, password: adminCreds.password });
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

    it('/auth/login (POST) - no body -> 400', async () => {
        const res = await request(app.getHttpServer()).post('/auth/login');
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.error).toBe('Bad Request');
        expect(res.body.message).toEqual(
            expect.arrayContaining([
                'email must be a lowercase string',
                'email must be a string',
                'email should not be empty',
                'email must be an email',
                'password must be a string',
                'password should not be empty',
            ]),
        );
    });

    it('/auth/login (POST) - invalid types -> 400/email validation', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 123, password: 'pass' });
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('email must be an email');
    });

    it('/auth/login (POST) - uppercase email -> treats lowercase then invalid password -> 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userCreds.email.toUpperCase(), password: 'wrong' });
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.message).toContain('Credentials are not valid (password)');
    });

    it('/auth/login (POST) - empty email -> 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: '', password: 'pass' });
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('email should not be empty');
    });

    it('/auth/login (POST) - invalid email format -> 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'no-at-domain', password: 'pass' });
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('email must be an email');
    });

    it('/auth/login (POST) - empty password -> 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userCreds.email, password: '' });
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('password should not be empty');
    });

    it('/auth/login (POST) - wrong password -> 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userCreds.email, password: 'wrongpass' });
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toEqual('Credentials are not valid (password)');
        expect(res.body.error).toBe('Unauthorized');
    });

    it('/auth/login (POST) - non-existent email -> 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'notfound@example.com', password: 'pass' });
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toEqual('Credentials are not valid (email)');
        expect(res.body.error).toBe('Unauthorized');
    });

    it('/auth/login (POST) - valid credentials -> 201 token', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userCreds.email, password: userCreds.password });
        expect(res.status).toBe(HttpStatus.CREATED);
        expect(res.body.token).toBeDefined();
    });

    it('/auth/login (POST) - extra fields -> 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userCreds.email, password: userCreds.password, extra: 'field' });
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('property extra should not exist');
        expect(res.body.error).toBe('Bad Request');
    });
});