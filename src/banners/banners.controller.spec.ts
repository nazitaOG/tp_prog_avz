import { Test, TestingModule } from '@nestjs/testing';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

describe('BannersController', () => {
    let controller: BannersController;
    let service: Record<string, jest.Mock>;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllActive: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BannersController],
            providers: [
                { provide: BannersService, useValue: service },
            ],
        }).compile();

        controller = module.get<BannersController>(BannersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createBanner', () => {
        it('delegates to bannersService.create', async () => {
            const file = { buffer: Buffer.from('') } as Express.Multer.File;
            const dto = {} as CreateBannerDto;
            const user = { id: '1', roles: [] } as unknown as UserWithRoles;

            await controller.createBanner(file, dto, user);
            expect(service.create).toHaveBeenCalledWith(dto, file, user);
        });
    });

    describe('findAll', () => {
        it('delegates to bannersService.findAll', () => {
            const query: PaginationDto = { limit: 5, offset: 10 };
            controller.findAll(query);
            expect(service.findAll).toHaveBeenCalledWith(query);
        });
    });

    describe('findAllActive', () => {
        it('delegates to bannersService.findAllActive', () => {
            controller.findAllActive();
            expect(service.findAllActive).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('delegates to bannersService.findOne', () => {
            const id = 'uuid';
            controller.findOne(id);
            expect(service.findOne).toHaveBeenCalledWith(id);
        });
    });

    describe('updateBanner', () => {
        it('delegates to bannersService.update', async () => {
            const id = 'uuid';
            const dto = {} as UpdateBannerDto;
            const user = { id: '1', roles: [] } as unknown as UserWithRoles;
            const file = { buffer: Buffer.from('') } as Express.Multer.File;

            await controller.updateBanner(id, dto, user, file);
            expect(service.update).toHaveBeenCalledWith(id, dto, user, file);
        });
    });

    describe('remove', () => {
        it('delegates to bannersService.remove', () => {
            const id = 'uuid';
            const user = { id: '1', roles: [] } as unknown as UserWithRoles;

            controller.remove(id, user);
            expect(service.remove).toHaveBeenCalledWith(id, user);
        });
    });
});
