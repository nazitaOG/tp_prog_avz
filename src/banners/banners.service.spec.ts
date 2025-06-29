import { Test, TestingModule } from '@nestjs/testing';
import { BannersService } from './banners.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BannerValidator } from './validations/banner.validator';
import { FilesService } from 'src/files/files.service';
import {
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';

describe('BannersService (unit)', () => {
    let service: BannersService;
    let prismaService: Partial<Record<keyof PrismaService, any>>;
    let bannerValidatorMock: Partial<BannerValidator>;
    let filesServiceMock: Partial<FilesService>;

    const user = { id: 'u1', name: 'Test', email: 'test@example.com', roles: [] } as any;

    beforeEach(async () => {
        prismaService = {
            banner: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        } as any;
        bannerValidatorMock = {
            validateCreate: jest.fn(),
            validateUpdate: jest.fn(),
        } as any;
        filesServiceMock = {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BannersService,
                { provide: PrismaService, useValue: prismaService },
                { provide: BannerValidator, useValue: bannerValidatorMock },
                { provide: FilesService, useValue: filesServiceMock },
            ],
        }).compile();

        service = module.get<BannersService>(BannersService);
        jest.spyOn(service['logger'], 'log').mockImplementation(() => { });
        jest.spyOn(service['logger'], 'error').mockImplementation(() => { });
    });

    describe('create()', () => {
        const dto = { destination_link: 'url', position_id: 'pos1' } as any;
        const file = { buffer: Buffer.from('') } as any;

        it('should throw if no file provided', async () => {
            await expect(service.create(dto, undefined as any, user)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should upload image, validate and create banner', async () => {
            (filesServiceMock.uploadImage as jest.Mock).mockResolvedValue({ secure_url: 's3://img', public_id: 'img123' } as any);
            (bannerValidatorMock.validateCreate as jest.Mock).mockResolvedValue({ dataField: 'value' } as any);
            (prismaService.banner!.create as jest.Mock).mockResolvedValue({ id: 'b1' } as any);

            const result = await service.create(dto, file, user);

            expect(filesServiceMock.uploadImage).toHaveBeenCalledWith(file);
            expect(bannerValidatorMock.validateCreate).toHaveBeenCalledWith(dto, user, 's3://img');
            expect(prismaService.banner!.create).toHaveBeenCalledWith({ data: { dataField: 'value' } });
            expect(result).toEqual({ id: 'b1' });
        });

        it('should rollback image on validation error', async () => {
            (filesServiceMock.uploadImage as jest.Mock).mockResolvedValue({ secure_url: 's3://img', public_id: 'img123' } as any);
            (bannerValidatorMock.validateCreate as jest.Mock).mockRejectedValue(new Error('validation failed'));

            await expect(service.create(dto, file, user)).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(filesServiceMock.deleteImage).toHaveBeenCalledWith('img123');
        });
    });

    describe('findAll()', () => {
        it('should return paginated banners', async () => {
            (prismaService.banner!.findMany as jest.Mock).mockResolvedValue([{ id: 'b1' }] as any);
            const result = await service.findAll({ limit: 2, offset: 3 });
            expect(prismaService.banner!.findMany).toHaveBeenCalledWith({
                skip: 3,
                take: 2,
                include: { user: true, position: true },
            });
            expect(result).toEqual([{ id: 'b1' }]);
        });
    });

    describe('findAllActive()', () => {
        it('should query active banners with date filter', async () => {
            (prismaService.banner!.findMany as jest.Mock).mockResolvedValue([{ id: 'b2' }] as any);
            const result = await service.findAllActive();
            expect(prismaService.banner!.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.any(Object) }),
            );
            expect(result).toEqual([{ id: 'b2' }]);
        });
    });

    describe('findOne()', () => {
        it('should return a banner if found', async () => {
            (prismaService.banner!.findUnique as jest.Mock).mockResolvedValue({ id: 'b1' } as any);
            const res = await service.findOne('b1');
            expect(prismaService.banner!.findUnique).toHaveBeenCalledWith({ where: { id: 'b1' } });
            expect(res).toEqual({ id: 'b1' });
        });

        it('should throw if not found', async () => {
            (prismaService.banner!.findUnique as jest.Mock).mockResolvedValue(null as any);
            await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('update()', () => {
        const dto = { destination_link: 'newurl' } as any;
        const file = { buffer: Buffer.from('') } as any;

        it('should throw if no changes provided', async () => {
            await expect(service.update('b1', {} as any, user)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should handle file upload and update', async () => {
            (filesServiceMock.uploadImage as jest.Mock).mockResolvedValue({ secure_url: 's3://img2', public_id: 'img456' } as any);
            (bannerValidatorMock.validateUpdate as jest.Mock).mockResolvedValue({ dataField: 'v2' } as any);
            (prismaService.banner!.update as jest.Mock).mockResolvedValue({ id: 'b1', dataField: 'v2' } as any);

            const res = await service.update('b1', dto, user, file);
            expect(filesServiceMock.uploadImage).toHaveBeenCalledWith(file);
            expect(bannerValidatorMock.validateUpdate).toHaveBeenCalledWith(dto, 'b1', user, 's3://img2');
            expect(prismaService.banner!.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { dataField: 'v2' } });
            expect(res).toEqual({ id: 'b1', dataField: 'v2' });
        });

        it('should rollback image on validation error', async () => {
            (filesServiceMock.uploadImage as jest.Mock).mockResolvedValue({ secure_url: 'url', public_id: 'pid' } as any);
            (bannerValidatorMock.validateUpdate as jest.Mock).mockRejectedValue(new Error('update failed'));

            await expect(
                service.update('b1', { foo: 'bar' } as any, user, file),
            ).rejects.toBeInstanceOf(InternalServerErrorException);
            expect(filesServiceMock.deleteImage).toHaveBeenCalledWith('pid');
        });
    });

    describe('remove()', () => {
        const otherUser = { id: 'u2', name: 'Other', email: 'other@example.com', roles: [] } as any;

        it('should throw if not found', async () => {
            (prismaService.banner!.findUnique as jest.Mock).mockResolvedValue(null as any);
            await expect(service.remove('b1', otherUser)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('should forbid if user not owner', async () => {
            (prismaService.banner!.findUnique as jest.Mock).mockResolvedValue({ id: 'b1', user_id: 'u3' } as any);
            await expect(service.remove('b1', otherUser)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should delete if owner', async () => {
            (prismaService.banner!.findUnique as jest.Mock).mockResolvedValue({ id: 'b1', user_id: 'u2' } as any);
            (prismaService.banner!.delete as jest.Mock).mockResolvedValue({ id: 'b1' } as any);
            const res = await service.remove('b1', otherUser);
            expect(prismaService.banner!.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
            expect(res).toEqual({ id: 'b1' });
        });
    });
});
