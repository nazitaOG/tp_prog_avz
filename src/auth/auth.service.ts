import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { handleRequest } from 'src/common/utils/hadle-request/handle-request';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }


  register(createUserDto: RegisterUserDto) {
    return handleRequest(async () => {

      const roles = ["user"]

      const hashed_password = await bcrypt.hash(createUserDto.password, 10);

      const name = createUserDto.name ?? createUserDto.email.split('@')[0];

      const user = await this.prisma.user.create({
        data: {
          name: name,
          email: createUserDto.email,
          hashed_password,
          roles: {
            create: roles.map(roleName => ({
              role: {
                connect: { name: roleName }
              }
            }))
          }
        },
      });

      const { hashed_password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, token: this.getJwtToken({ id: user.id }) };

    }, 'Failed to create user', this.logger);
  }

  login(loginUserDto: LoginUserDto) {
    return handleRequest(async () => {
      const { password, email } = loginUserDto;
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          email: true,
          hashed_password: true,
          id: true,
          roles: {
            select: {
              role: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });

      if (!user) {
        throw new UnauthorizedException('Credentials are not valid (email)');
      }

      const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credentials are not valid (password)');
      }

      const { hashed_password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, token: this.getJwtToken({ id: user.id }) };

    }, 'Failed to login user', this.logger);
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
