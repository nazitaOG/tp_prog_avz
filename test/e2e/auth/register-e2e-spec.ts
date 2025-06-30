import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';

const testingUser = {
    email: 'testing.user@google.com',
    password: 'Abc12345!',
    name: 'Testing user',
};

const testingUserCaseSensitive = {
    email: 'Testing.Usurio@google.com',
    password: 'Abc12345!',
    name: 'Testing user',
};

describe('AuthModule Register (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

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

        prisma = app.get(PrismaService);

        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { in: [testingUser.email, testingUserCaseSensitive.email.toLowerCase()] } },
        });
        await app.close();
    });

    it('/auth/register (POST) - no body', async () => {
        const expectedErrors = [
            'email must be a lowercase string',
            'email must be a string',
            'email should not be empty',
            'email must be an email',
            'password must be a string',
            'password should not be empty',
            'password is not strong enough',
        ];

        const response = await request(app.getHttpServer()).post('/auth/register');

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual(expectedErrors);
        expect(response.body.error).toContain('Bad Request');
    });

    it('/auth/register (POST) - email is not an email', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ ...testingUser, email: 'not-an-email' });

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toContain('email must be an email');
        expect(response.body.error).toBe('Bad Request');
    });

    it('/auth/register (POST) - password is not strong enough', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ ...testingUser, password: '123456' });

        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toContain('password is not strong enough');
        expect(response.body.error).toBe('Bad Request');
    });

    it('/auth/register (POST) - email is not lowercase', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testingUserCaseSensitive);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toEqual(
            expect.objectContaining({
                user: expect.objectContaining({
                    name: testingUserCaseSensitive.name.toLowerCase(),
                    email: testingUserCaseSensitive.email.toLowerCase(),
                }),
                token: expect.any(String),
            }),
        );
    });

    it('/auth/register (POST) - valid credentials', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testingUser);

        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body).toEqual(
            expect.objectContaining({
                user: expect.objectContaining({
                    name: testingUser.name.toLowerCase(),
                    email: testingUser.email.toLowerCase(),
                }),
                token: expect.any(String),
            }),
        );
    });

    it('/auth/register (POST) - same email', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testingUser);

        expect(response.status).toBe(HttpStatus.CONFLICT);
        expect(response.body.message).toContain('Duplicate value for unique constraint on email');
        expect(response.body.error).toBe('Conflict');
    });
});
