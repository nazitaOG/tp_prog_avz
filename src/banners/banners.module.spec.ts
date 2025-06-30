import { Test, TestingModule } from '@nestjs/testing';
import { BannersModule } from 'src/banners/banners.module';
import { BannersService } from 'src/banners/banners.service';
import { BannerRepository } from 'src/banners/utils/banner.repository';
import { BannerValidator } from 'src/banners/validations/banner.validator';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FilesService } from 'src/files/files.service';

describe('BannersModule (Unit)', () => {
    let module: TestingModule;

    beforeAll(async () => {

        const prismaStub = {} as unknown as PrismaService;
        const filesStub = {} as unknown as FilesService;

        module = await Test.createTestingModule({
            imports: [BannersModule],
        })
            .overrideProvider(PrismaService)
            .useValue(prismaStub)
            .overrideProvider(FilesService)
            .useValue(filesStub)
            .compile();
    });

    afterAll(async () => {
        await module.close();
    });

    it('should compile and resolve providers', () => {
        const service = module.get<BannersService>(BannersService);
        const repo = module.get<BannerRepository>(BannerRepository);
        const validator = module.get<BannerValidator>(BannerValidator);

        expect(service).toBeDefined();
        expect(repo).toBeDefined();
        expect(validator).toBeDefined();
    });
});