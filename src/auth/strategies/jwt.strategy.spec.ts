import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategies";
import { TestingModule, Test } from "@nestjs/testing";
import { PrismaService } from "src/common/prisma/prisma.service";
import { UnauthorizedException } from "@nestjs/common";

describe('JwtStrategy', () => {
    let jwtStrategy: JwtStrategy;
    let prisma: { user: { findUnique: jest.Mock } };

    beforeEach(async () => {

        prisma = {
            user: {
                findUnique: jest.fn(),
            }
        }
        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtStrategy,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: () => 'JWT_SECRET',
                    },
                }
            ],
        }).compile();

        jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    });

    it('should be defined', () => {
        expect(jwtStrategy).toBeDefined();
    });

    describe('validate', () => {
        const payload = {
            id: '1dafasdsdadsfasfasdasd',
        }

        it('should return a user when prisma returns one', async () => {
            const mockUser = {
                id: '1dafasdsdadsfasfasdasd',
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password',
                createdAt: new Date(),
                roles: [{
                    id: '1',
                    name: 'admin',
                    createdAt: new Date(),
                }]
            }

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const result = await jwtStrategy.validate(payload);

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: '1dafasdsdadsfasfasdasd' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roles: { include: { role: true } }
                }
            });
        });

        it('should throw UnauthorizedException if no user is found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(jwtStrategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});

