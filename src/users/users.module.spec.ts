import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';

describe('UsersModule', () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [UsersModule],
        }).compile();
    });

    it('should resolve UsersService', () => {
        const service = moduleRef.get(UsersService);
        expect(service).toBeDefined();
    });

    it('should resolve UsersController', () => {
        const controller = moduleRef.get(UsersController);
        expect(controller).toBeDefined();
    });

    it('should resolve PrismaService via UsersModule imports', () => {
        const prisma = moduleRef.get(PrismaService);
        expect(prisma).toBeDefined();
    });
});
