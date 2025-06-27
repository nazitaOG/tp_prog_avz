import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtPayload } from "../interfaces/payload.interface";
import { UserWithRoles } from "../../prisma/interfaces/user-with-role.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly prisma: PrismaService,
        configService: ConfigService
    ) {
        super({
            secretOrKey: configService.get('JWT_SECRET') || '',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload): Promise<UserWithRoles> {
        const { id } = payload;

        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                roles: {
                    include: {
                        role: true,  
                    }
                }
            }
        });

        if (!user) {
            throw new UnauthorizedException('Token not valid');
        }

        return user as UserWithRoles;
    }
}
