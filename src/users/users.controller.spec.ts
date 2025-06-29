import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserIdentifierDto } from './dto/user-identifier.dto';

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
            providers: [
                { provide: UsersService, useValue: service },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('delegates to usersService.create', async () => {
            const dto = { name: 'Alice', email: 'a@b.com', password: '123' } as CreateUserDto;
            const user = { id: '1', roles: [] } as unknown as UserWithRoles;

            await controller.create(dto, user);
            expect(service.create).toHaveBeenCalledWith(dto, user);
        });
    });

    describe('findAll', () => {
        it('delegates to usersService.findAll', () => {
            const query: PaginationDto = { limit: 5, offset: 2 };
            controller.findAll(query);
            expect(service.findAll).toHaveBeenCalledWith(query);
        });
    });

    describe('findOne', () => {
        it('delegates to usersService.findOne', () => {
            const identifier: UserIdentifierDto = { term: 'abc' };
            controller.findOne(identifier);
            expect(service.findOne).toHaveBeenCalledWith(identifier.term);
        });
    });

    describe('update', () => {
        it('delegates to usersService.update', async () => {
            const identifier: UserIdentifierDto = { term: 'abc' };
            const dto = { name: 'Bob' } as UpdateUserDto;
            const user = { id: '1', roles: [] } as unknown as UserWithRoles;

            await controller.update(identifier, dto, user);
            expect(service.update).toHaveBeenCalledWith(identifier.term, dto, user);
        });
    });

    describe('remove', () => {
        it('delegates to usersService.remove', () => {
            const identifier: UserIdentifierDto = { term: 'abc' };
            const user = { id: '1', roles: [] } as unknown as UserWithRoles;

            controller.remove(identifier, user);
            expect(service.remove).toHaveBeenCalledWith(identifier.term, user);
        });
    });
});
