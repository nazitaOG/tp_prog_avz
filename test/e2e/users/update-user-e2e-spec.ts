import { Test, TestingModule } from '@nestjs/testing';
import {
    INestApplication,
    Logger,
    ValidationPipe,
    HttpStatus,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123',
};

function uniqueEmail(prefix: string) {
    return `${prefix}+${Date.now()}@example.com`;
}

describe('UsersModule Update User (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;

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

        const resAdminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send(adminCredentials);
        expect(resAdminLogin.status).toBe(HttpStatus.CREATED);
        adminToken = resAdminLogin.body.token;
    });

    afterAll(async () => {
        await app.close();
    });

    it('PATCH /users - without token - 401', async () => {
        const email = uniqueEmail('user');
        const res = await request(app.getHttpServer())
            .patch('/users')
            .send({ name: 'NewName' });

        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toContain('Unauthorized');
    });

    it('PATCH /users - user tries to change roles - 403', async () => {
        const email = uniqueEmail('user2');
        await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'Test123!', name: 'Test' });
        const resLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'Test123!' });
        const userToken = resLogin.body.token;

        const res = await request(app.getHttpServer())
            .patch('/users')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ roles: ['admin'] });

        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toBe('You are not authorized to change roles');

        const newUserRes = await request(app.getHttpServer()).post('/auth/login').send(adminCredentials);
        const cleanupToken = newUserRes.body.token;
        const reg = await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${cleanupToken}`);
    });

    it('PATCH /users - user updates own name - 200', async () => {
        const email = uniqueEmail('user3');
        await request(app.getHttpServer()).post('/auth/register').send({ email, password: 'Test123!', name: 'Test' });
        const resLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'Test123!' });
        const userToken = resLogin.body.token;

        const newName = `User-${Date.now()}`;
        const res = await request(app.getHttpServer())
            .patch('/users')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ name: newName });

        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.user.name).toBe(newName.toLowerCase());
    });

    it('PATCH /users/:id - admin cannot update self - 400', async () => {
        const resAdmin = await request(app.getHttpServer()).post('/auth/login').send(adminCredentials);
        const adminId = resAdmin.body.user.id;

        const res = await request(app.getHttpServer())
            .patch(`/users/${adminId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'HackedAdmin' });

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('Admin cannot update his own account');
    });

    it('PATCH /users/:id - admin cannot change roles of another admin - 403', async () => {
        const resSecond = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: uniqueEmail('admin'), password: 'Admin123!', roles: ['admin', 'user'] });
        const secondId = resSecond.body.user.id;

        const res = await request(app.getHttpServer())
            .patch(`/users/${secondId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ roles: ['user'] });

        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toBe('Cannot change roles of an admin user');

        await request(app.getHttpServer())
            .delete(`/users/${secondId}`)
            .set('Authorization', `Bearer ${adminToken}`);
    });

    it('PATCH /users/:invalid - admin with invalid term - 400', async () => {
        const res = await request(app.getHttpServer())
            .patch('/users/not-a-valid-term')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Foo' });

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('You must provide a valid id or email');
    });

    it('PATCH /users/:id - admin updates user email and roles - 200', async () => {
        const email = uniqueEmail('user4');
        const resReg = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password: 'Test123!', name: 'Test' });
        const userId = resReg.body.user.id;

        const updatedEmail = uniqueEmail('upd');
        const res = await request(app.getHttpServer())
            .patch(`/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: updatedEmail, roles: ['advertiser', 'user'] });

        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.user.id).toBe(userId);
        expect(res.body.user.email).toBe(updatedEmail);
        expect(Array.isArray(res.body.user.roles)).toBe(true);
        expect(res.body.user.roles).toHaveLength(2);

        await request(app.getHttpServer())
            .delete(`/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
    });
});
