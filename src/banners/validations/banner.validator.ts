import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Position, RenewalStrategy } from '@prisma/client';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { UpdateBannerDto } from '../dto/update-banner.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import {
    validateDates,
    validateRenewalLogic,
    validateBannerCount,
    validateDisplayOrder,
    getPosition,
} from './utils';

@Injectable()
export class BannerValidator {
    private readonly logger = new Logger(BannerValidator.name);

    constructor(private readonly prisma: PrismaService) { }

    async validateCreate(dto: CreateBannerDto, user: UserWithRoles, secureUrl: string) {
        this.logger.log('Validating banner creation DTO');

        const startDate = dto.start_date ?? new Date();
        const endDate = dto.end_date ?? null;

        validateDates(startDate, endDate);
        validateRenewalLogic(dto.renewal_strategy, dto.renewal_period, endDate);

        const position = await getPosition(this.prisma, dto.position_id);

        await validateBannerCount(
            this.prisma,
            position.id,
            startDate,
            endDate,
            position.max_banners
        );

        await validateDisplayOrder(
            this.prisma,
            dto.display_order,
            position.max_banners,
            position.id,
            startDate,
            endDate
        );

        return {
            image_url: secureUrl,
            destination_link: dto.destination_link,
            start_date: startDate,
            end_date: endDate,
            renewal_strategy:
                (dto.renewal_strategy as RenewalStrategy) ?? RenewalStrategy.manual,
            renewal_period:
                dto.renewal_strategy === RenewalStrategy.automatic
                    ? dto.renewal_period
                    : null,
            user_id: user.id,
            position_id: position.id,
            display_order: dto.display_order,
        };
    }

    async validateUpdate(
        dto: UpdateBannerDto,
        bannerId: string,
        user: UserWithRoles,
        secureUrl?: string
    ): Promise<UpdateBannerDto> {
        this.logger.log(`Validating update for banner ${bannerId}`);

        const existing = await this.prisma.banner.findUnique({
            where: { id: bannerId },
            select: {
                start_date: true,
                end_date: true,
                position: { select: { id: true, max_banners: true, name: true } },
                user_id: true,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Banner ${bannerId} not found`);
        }

        if (
            user.id !== existing.user_id &&
            !user.roles.some((role) => role.role_id === ValidRoles.admin)
        ) {
            throw new BadRequestException('You are not authorized to update this banner');
        }

        const startDate = dto.start_date ?? existing.start_date;
        const endDate = dto.end_date ?? existing.end_date ?? null;
        validateDates(startDate, endDate);

        if (dto.renewal_strategy) {
            validateRenewalLogic(dto.renewal_strategy, dto.renewal_period, endDate);
        }

        let position: Position = existing.position;
        if (dto.position_id) {
            position = await getPosition(this.prisma, dto.position_id);
        }

        if (position.max_banners > 1 && dto.display_order == null) {
            throw new BadRequestException(
                'display_order is required when position allows multiple banners'
            );
        }

        await validateBannerCount(
            this.prisma,
            position.id,
            startDate,
            endDate,
            position.max_banners,
            bannerId
        );

        if (dto.display_order) {
            if (position.max_banners <= 1) {
                this.logger.error(
                    `display_order not allowed for position ${position.id} (max_banners=1)`
                );
                throw new BadRequestException(
                    'display_order is not allowed when position allows only one banner'
                );
            }

            await validateDisplayOrder(
                this.prisma,
                dto.display_order,
                position.max_banners,
                position.id,
                startDate,
                endDate,
                bannerId
            );
        }

        return {
            ...(dto.destination_link !== undefined && {
                destination_link: dto.destination_link,
            }),
            ...(dto.start_date !== undefined && { start_date: startDate }),
            ...(dto.end_date !== undefined && { end_date: endDate ?? undefined }),
            ...(dto.renewal_strategy !== undefined && {
                renewal_strategy: dto.renewal_strategy,
            }),
            ...(dto.renewal_period !== undefined &&
                dto.renewal_strategy === RenewalStrategy.automatic && {
                renewal_period: dto.renewal_period!,
            }),
            ...(dto.position_id !== undefined && { position_id: position.id }),
            ...(dto.display_order != null && { display_order: dto.display_order }),
            ...(secureUrl && { image_url: secureUrl }),
        };
    }
}
