import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserIdentifierDto } from './dto/user-identifier.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';

describe('UsersController', () => {
    let controller: UsersController;
    let service: Record<string, jest.Mock>;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: service }],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create()', () => {
        it('delegates to usersService.create', async () => {
            const dto = { name: 'Alice', email: 'a@b.com', password: '123' } as CreateUserDto;
            const admin = { id: '1', roles: [{ role_id: ValidRoles.admin }] } as UserWithRoles;

            await controller.create(dto, admin);
            expect(service.create).toHaveBeenCalledWith(dto, admin);
        });
    });

    describe('findAll()', () => {
        it('delegates to usersService.findAll', () => {
            const query: PaginationDto = { limit: 5, offset: 2 };
            controller.findAll(query);
            expect(service.findAll).toHaveBeenCalledWith(query);
        });
    });

    describe('findOne()', () => {
        it('delegates to usersService.findOne', () => {
            const identifier: UserIdentifierDto = { term: 'foo' };
            controller.findOne(identifier);
            expect(service.findOne).toHaveBeenCalledWith(identifier.term);
        });
    });

    describe('updateSelf()', () => {
        it('delegates to usersService.update without term', async () => {
            const dto = { name: 'Bob' } as UpdateUserDto;
            const user = { id: 'u2', roles: [{ role_id: ValidRoles.user }] } as UserWithRoles;

            await controller.updateSelf(dto, user);
            expect(service.update).toHaveBeenCalledWith(dto, user);
        });
    });

    describe('updateOther()', () => {
        it('delegates to usersService.update with term', async () => {
            const identifier: UserIdentifierDto = { term: 'u3' };
            const dto = { name: 'Carol' } as UpdateUserDto;
            const admin = { id: 'u1', roles: [{ role_id: ValidRoles.admin }] } as UserWithRoles;

            await controller.updateOther(identifier, dto, admin);
            expect(service.update).toHaveBeenCalledWith(dto, admin, identifier.term);
        });
    });

    describe('removeSelf()', () => {
        it('delegates to usersService.remove without term', () => {
            const user = { id: 'u2', roles: [{ role_id: ValidRoles.user }] } as UserWithRoles;

            controller.removeSelf(user);
            expect(service.remove).toHaveBeenCalledWith(user);
        });
    });

    describe('removeOther()', () => {
        it('delegates to usersService.remove with term', () => {
            const identifier: UserIdentifierDto = { term: 'u4' };
            const admin = { id: 'u1', roles: [{ role_id: ValidRoles.admin }] } as UserWithRoles;

            controller.removeOther(identifier, admin);
            expect(service.remove).toHaveBeenCalledWith(admin, identifier.term);
        });
    });
});
