// src/auth/auth.module.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategies';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';

describe('AuthModule', () => {
    let module: TestingModule;

    beforeAll(async () => {
        const prismaStub = {
            user: {
                findUnique: jest.fn(),
            },
        };

        const configStub = {
            get: jest.fn((key: string) => {
                if (key === 'JWT_SECRET') return 'test-secret';
                return null;
            }),
        };

        module = await Test.createTestingModule({
            imports: [AuthModule],
        })
            .overrideProvider(ConfigService)
            .useValue(configStub)
            .overrideProvider(PrismaService)
            .useValue(prismaStub)
            .compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('AuthService debe estar definido', () => {
        const service = module.get<AuthService>(AuthService);
        expect(service).toBeDefined();
    });

    it('JwtStrategy debe estar definido', () => {
        const strategy = module.get<JwtStrategy>(JwtStrategy);
        expect(strategy).toBeDefined();
    });
});
