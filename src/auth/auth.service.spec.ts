import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';


jest.mock('bcrypt');

describe('AuthService (unit)', () => {
  let service: AuthService;
  let mockPrisma: { user: { create: jest.Mock; findUnique: jest.Mock } };
  let mockJwtService: { sign: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    } as any;
    mockJwtService = { sign: jest.fn() } as any;

    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.compare as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest
      .spyOn(service['logger'], 'log')
      .mockImplementation(() => undefined);
    jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => undefined);
  });

  describe('register()', () => {
    it('should create a user and return user without password and token', async () => {
      const dto: RegisterUserDto = {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'pass123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');

      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        hashed_password: 'hashed123',
        roles: [{ role: { id: 1, name: 'user' } }],
      });

      mockJwtService.sign.mockReturnValue('token123');

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Alice',
          email: 'alice@example.com',
          hashed_password: 'hashed123',
          roles: {
            create: [{ role: { connect: { name: 'user' } } }],
          },
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ id: 'u1' });
      expect(result).toEqual({
        user: { id: 'u1', name: 'Alice', email: 'alice@example.com', roles: [{ role: { id: 1, name: 'user' } }] },
        token: 'token123',
      });
    });
  });

  describe('login()', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'p' } as LoginUserDto)
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'x@x.com' },
        select: {
          email: true,
          hashed_password: true,
          id: true,
          roles: { select: { role: { select: { id: true, name: true } } } },
        },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', hashed_password: 'h', roles: [] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' } as LoginUserDto)
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'h');
    });

    it('should return user and token when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        hashed_password: 'h',
        roles: [{ role: { id: 1, name: 'admin' } }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('tok');

      const result = await service.login({ email: 'a@b.com', password: 'pass' } as LoginUserDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
        select: {
          email: true,
          hashed_password: true,
          id: true,
          roles: { select: { role: { select: { id: true, name: true } } } },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'h');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ id: 'u1' });
      expect(result).toEqual({
        user: { id: 'u1', email: 'a@b.com', roles: [{ role: { id: 1, name: 'admin' } }] },
        token: 'tok',
      });
    });
  });
});
