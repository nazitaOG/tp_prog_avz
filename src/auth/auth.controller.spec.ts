import { TestingModule, Test } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";

describe('AuthController', () => {

    let authController: AuthController;
    const mockAuthService = {
        login: jest.fn(),
        register: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(authController).toBeDefined();
    });

    it('should send a register request to the auth service', async () => {
        const registerDto: RegisterUserDto = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            password: 'password',
        }

        await authController.create(registerDto);

        expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    })

    it('should send a login request to the auth service', async () => {
        const loginDto: LoginUserDto = {
            email: 'john.doe@example.com',
            password: 'password',
        }

        await authController.login(loginDto);

        expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    })
});