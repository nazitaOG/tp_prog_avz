import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

const userLogin = {
    email: 'user@example.com',
    password: 'user123',
};

const adminLogin = {
    email: 'admin@example.com',
    password: 'admin123',
};

const randomSuffix = Date.now();
const newUserEmail = `testuser+${randomSuffix}@example.com`;
const newUserWithRoleEmail = `testadv+${randomSuffix}@example.com`;

describe('UsersModule Create User (e2e)', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;
    let createdUserId: string;

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

        const resUser = await request(app.getHttpServer())
            .post('/auth/login')
            .send(userLogin);
        expect(resUser.status).toBe(HttpStatus.CREATED);
        userToken = resUser.body.token;

        const resAdmin = await request(app.getHttpServer())
            .post('/auth/login')
            .send(adminLogin);
        expect(resAdmin.status).toBe(HttpStatus.CREATED);
        adminToken = resAdmin.body.token;
    });

    afterAll(async () => {
        if (createdUserId) {
            await request(app.getHttpServer())
                .delete(`/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(HttpStatus.OK);
        }
        await app.close();
    });

    it('POST /users – without token – 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/users')
            .send({
                email: newUserEmail,
                password: 'Abc12345!',
            });
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toContain('Unauthorized');
    });

    it('POST /users – user tries to assign admin role – 403', async () => {
        const res = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                email: newUserWithRoleEmail,
                password: 'Abc12345!',
                roles: ['admin'],
            });
        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.message).toMatch(/^User .+ does not have the required role: 1$/);
    });

    it('POST /users – admin assigns advertiser role – 201 and roles correct', async () => {
        const res = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                email: newUserWithRoleEmail,
                password: 'Abc13456!',
                roles: ['advertiser', 'user'],
            });
        expect(res.status).toBe(HttpStatus.CREATED);
        expect(res.body.user.email).toBe(newUserWithRoleEmail);
        expect(Array.isArray(res.body.user.roles)).toBe(true);
        expect(res.body.user.roles).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    role: expect.objectContaining({ name: 'advertiser' }),
                }),
                expect.objectContaining({
                    role: expect.objectContaining({ name: 'user' }),
                }),
            ]),
        );
        createdUserId = res.body.user.id;
    });
});
