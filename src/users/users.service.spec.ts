import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { isUUID } from 'class-validator';

jest.mock('bcrypt');
jest.mock('class-validator', () => ({ isUUID: jest.fn() }));

describe('UsersService (unit)', () => {
    let service: UsersService;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            user: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);

        //para silenciar los logs
        jest.spyOn(service['logger'], 'log').mockImplementation(() => { });
        jest.spyOn(service['logger'], 'error').mockImplementation(() => { });
    });

    describe('create()', () => {
        const baseDto: CreateUserDto = { email: 'a@b.com', password: '123', name: 'Alice' };
        const adminUser: UserWithRoles = { id: 'u1', roles: [{ role_id: ValidRoles.admin }] } as any;
        const normalUser: UserWithRoles = { id: 'u2', roles: [{ role_id: ValidRoles.user }] } as any;

        it('should forbid non-admin assigning elevated roles', async () => {
            const dto = { ...baseDto, roles: ['admin'] } as any;
            await expect(service.create(dto, normalUser)).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('should hash password and create user for admin', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            const createdUser = { id: 'new', email: baseDto.email, name: baseDto.name, hashed_password: 'hashed', roles: [] };
            prisma.user.create.mockResolvedValue(createdUser);

            const result = await service.create(baseDto, adminUser);

            expect(bcrypt.hash).toHaveBeenCalledWith(baseDto.password, 10);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: baseDto.email,
                    name: baseDto.name,
                    hashed_password: 'hashed',
                }),
            });
            expect(result).toEqual({ user: expect.objectContaining({ id: 'new', email: baseDto.email }) });
        });
    });

    describe('findAll()', () => {
        it('should call prisma.findMany with pagination', async () => {
            const users = [{ id: 'u1' }, { id: 'u2' }];
            prisma.user.findMany.mockResolvedValue(users);
            const pagination: PaginationDto = { limit: 5, offset: 2 };

            const result = await service.findAll(pagination);

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                skip: 2,
                take: 5,
                select: expect.any(Object),
            });
            expect(result).toBe(users);
        });
    });

    describe('findOne()', () => {
        it('should find by ID when term is UUID', async () => {
            (isUUID as jest.Mock).mockReturnValue(true);
            const user = { id: 'u1', email: 'a@b.com', hashed_password: 'h' };
            prisma.user.findUnique.mockResolvedValue(user);

            const res = await service.findOne('u1');

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
            expect(res).toEqual(expect.objectContaining({ id: 'u1', email: 'a@b.com' }));
        });

        it('should find by email when term is not UUID', async () => {
            (isUUID as jest.Mock).mockReturnValue(false);
            const user = { id: 'u1', email: 'x@y', hashed_password: 'h' };
            prisma.user.findUnique.mockResolvedValue(user);

            const res = await service.findOne('x@y');

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'x@y' } });
            expect(res).toEqual(expect.objectContaining({ email: 'x@y' }));
        });

        it('should throw NotFoundException when no user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(service.findOne('none')).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('update()', () => {
        const admin: UserWithRoles = { id: 'u1', roles: [{ role_id: ValidRoles.admin }] } as any;
        const user: UserWithRoles = { id: 'u2', roles: [{ role_id: ValidRoles.user }] } as any;

        it('should forbid non-admin changing roles', async () => {
            const dto = { roles: ['admin'] } as any;
            await expect(service.update('u2', dto, user)).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('should allow non-admin to update self', async () => {
            const dto = { name: 'New' } as any;
            prisma.user.update.mockResolvedValue({ id: 'u2', name: 'New', roles: [] });

            const res = await service.update('u2', dto, user);

            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'u2' },
            }));
            expect(res).toEqual({ user: expect.objectContaining({ name: 'New' }) });
        });

        it('should forbid admin updating self', async () => {
            (isUUID as jest.Mock).mockReturnValue(true);
            const dto = { name: 'x' } as any;
            await expect(service.update('u1', dto, admin)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should allow admin updating other user', async () => {
            (isUUID as jest.Mock).mockReturnValue(true);
            const dto = { name: 'Changed', roles: ['user'] } as any;
            prisma.user.update.mockResolvedValue({ id: 'u2', name: 'Changed', roles: [] });

            const res = await service.update('u2', dto, admin);

            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'u2' },
                data: expect.objectContaining({ name: 'Changed' }),
            }));
            expect(res).toEqual({ user: expect.objectContaining({ name: 'Changed' }) });
        });
    });

    describe('remove()', () => {
        const admin: UserWithRoles = { id: 'u1', roles: [{ role_id: ValidRoles.admin }] } as any;
        const user: UserWithRoles = { id: 'u2', roles: [{ role_id: ValidRoles.user }] } as any;

        it('should delete self when non-admin and no term', async () => {
            prisma.user.delete.mockResolvedValue({ id: 'u2' });
            const res = await service.remove('', user);
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
            // returns raw delete
            expect(res).toEqual({ id: 'u2' });
        });

        it('should forbid non-admin providing term', async () => {
            await expect(service.remove('x', user)).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should forbid admin deleting self', async () => {
            (isUUID as jest.Mock).mockReturnValue(true);
            await expect(service.remove('u1', admin)).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('should delete other user for admin by email', async () => {
            (isUUID as jest.Mock).mockReturnValue(false);
            const deleted = { id: 'u2', email: 'x@y', roles: [], banners: [] };
            prisma.user.delete.mockResolvedValue(deleted);

            const res = await service.remove('x@y', admin);

            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { email: 'x@y' }, include: { roles: true, banners: true } });
            expect(res).toEqual({ user: expect.objectContaining({ id: 'u2', email: 'x@y' }) });
        });
    });
});