import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123',
};

function uniqueEmail(prefix: string) {
    return `${prefix}+${Date.now()}@example.com`;
}

describe('UsersModule Delete User (e2e)', () => {
    let app: INestApplication;
    let adminToken: string;

    beforeAll(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: true } }));
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

    it('DELETE /users/:id - without token - 401', async () => {
        const email = uniqueEmail('del');
        const userCreds = { email, password: 'Delete123!', name: 'Delete User' };
        const resReg = await request(app.getHttpServer()).post('/auth/register').send(userCreds);
        expect(resReg.status).toBe(HttpStatus.CREATED);
        const userId = resReg.body.user.id;

        const res = await request(app.getHttpServer()).delete(`/users/${userId}`);
        expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(res.body.message).toContain('Unauthorized');

        await request(app.getHttpServer())
            .delete(`/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
    });

    it('DELETE /users - user deletes self - 200', async () => {
        const email = uniqueEmail('del');
        const userCreds = { email, password: 'Delete123!', name: 'Delete User' };
        const resReg = await request(app.getHttpServer()).post('/auth/register').send(userCreds);
        expect(resReg.status).toBe(HttpStatus.CREATED);

        const resLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: userCreds.password });
        expect(resLogin.status).toBe(HttpStatus.CREATED);
        const userToken = resLogin.body.token;

        const res = await request(app.getHttpServer())
            .delete('/users')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body).toEqual({});
    });

    it('DELETE /users/:id - user cannot delete other - 400', async () => {
        const email1 = uniqueEmail('u1');
        const creds1 = { email: email1, password: 'Delete123!', name: 'User1' };
        const reg1 = await request(app.getHttpServer()).post('/auth/register').send(creds1);
        expect(reg1.status).toBe(HttpStatus.CREATED);
        const id1 = reg1.body.user.id;

        const email2 = uniqueEmail('u2');
        const creds2 = { email: email2, password: 'Delete123!', name: 'User2' };
        const reg2 = await request(app.getHttpServer()).post('/auth/register').send(creds2);
        expect(reg2.status).toBe(HttpStatus.CREATED);
        const id2 = reg2.body.user.id;

        const login1 = await request(app.getHttpServer()).post('/auth/login').send({ email: email1, password: creds1.password });
        const token1 = login1.body.token;

        const res = await request(app.getHttpServer())
            .delete(`/users/${id2}`)
            .set('Authorization', `Bearer ${token1}`);
        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toBe('User user1 does not have the required role: 1');

        await request(app.getHttpServer()).delete(`/users/${id2}`).set('Authorization', `Bearer ${adminToken}`);
        await request(app.getHttpServer()).delete(`/users/${id1}`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('DELETE /users/:invalid - admin invalid term - 400', async () => {
        const res = await request(app.getHttpServer())
            .delete('/users/not-a-valid-term')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('You must provide a valid id or email');
    });

    it('DELETE /users/:id - admin deletes self - 403', async () => {
        const resAdmin = await request(app.getHttpServer()).post('/auth/login').send(adminCredentials);
        const adminId = resAdmin.body.user.id;

        const res = await request(app.getHttpServer())
            .delete(`/users/${adminId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toBe('Admin cannot delete their own account');
    });

    it('DELETE /users/:term - admin cannot delete another admin - 403', async () => {
        const email = uniqueEmail('adm');
        const resSecond = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email, password: 'Admin123!', roles: ['admin', 'user'] });
        expect(resSecond.status).toBe(HttpStatus.CREATED);
        const secondId = resSecond.body.user.id;

        const res = await request(app.getHttpServer())
            .delete(`/users/${secondId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.FORBIDDEN);
        expect(res.body.message).toBe('Cannot delete an admin user');

        await request(app.getHttpServer()).delete(`/users/${secondId}`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('DELETE /users/:id - admin deletes other user - 200', async () => {
        const email = uniqueEmail('del');
        const creds = { email, password: 'Delete123!', name: 'Delete User' };
        const reg = await request(app.getHttpServer()).post('/auth/register').send(creds);
        expect(reg.status).toBe(HttpStatus.CREATED);
        const id = reg.body.user.id;

        const res = await request(app.getHttpServer())
            .delete(`/users/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(HttpStatus.OK);
        expect(res.body.user.id).toBe(id);
    });
});
