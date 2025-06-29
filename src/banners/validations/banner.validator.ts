import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Position, RenewalStrategy, User } from '@prisma/client';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { UpdateBannerDto } from '../dto/update-banner.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles.interface';
import { UserWithRoles } from 'src/common/prisma/interfaces/user-with-role.interface';
import { validateDates, validateRenewalLogic, validateBannerCount, validateDisplayOrder, getPosition } from './utils';

@Injectable()
export class BannerValidator {
    private readonly logger = new Logger(BannerValidator.name);

    constructor(private readonly prisma: PrismaService) { }

    async validateCreate(dto: CreateBannerDto, user: UserWithRoles, secureUrl: string) {
        this.logger.log('Validating banner creation DTO');

        // If start_date is not provided, set it to the current date
        const startDate = dto.start_date ?? new Date();
        // If end_date is not provided, set it to null
        const endDate = dto.end_date ?? null;

        // Validate dates
        validateDates(startDate, endDate);

        // Validate renewal period
        validateRenewalLogic(dto.renewal_strategy, dto.renewal_period, endDate);


        // Validate if position exists
        const position = await getPosition(this.prisma, dto.position_id);

        // Validate if banner count is less than max_banners at the same time range
        validateBannerCount(this.prisma, position.id, startDate, endDate, position.max_banners);


        // Validate display order
        validateDisplayOrder(this.prisma, dto.display_order, position.max_banners);

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

    async validateUpdate(dto: UpdateBannerDto, bannerId: string, user: UserWithRoles, secureUrl?: string): Promise<UpdateBannerDto> {
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

        //if dont have admin role, only the owner of the banner can update it
        if (user.id !== existing.user_id && !user.roles.some(role => role.role_id === ValidRoles.admin)) {
            throw new BadRequestException('You are not authorized to update this banner');
        }

        const startDate = dto.start_date ?? existing.start_date;
        const endDate = dto.end_date ?? existing.end_date ?? null;
        validateDates(startDate, endDate);

        // If renewal_strategy is provided, validate it
        if (dto.renewal_strategy) {
            validateRenewalLogic(dto.renewal_strategy, dto.renewal_period, endDate);
        }

        // if position_id is provided use it, otherwise use the existing position_id
        let position: Position = existing.position;
        if (dto.position_id) {
            position = await getPosition(this.prisma, dto.position_id);
        }

        // if position allows multiple banners, display_order is required
        if (position.max_banners > 1 && dto.display_order == null) {
            throw new BadRequestException(
                'display_order is required when position allows multiple banners',
            );
        }


        // validate banner count excluding the current banner
        validateBannerCount(this.prisma, position.id, startDate, endDate, position.max_banners, bannerId);

        // if display_order is provided, validate it
        if (dto.display_order) {
            // not allow display_order in positions with only one banner
            if (position.max_banners <= 1) {
                this.logger.error(
                    `display_order not allowed for position ${position.id} (max_banners=1)`,
                );
                throw new BadRequestException(
                    'display_order is not allowed when position allows only one banner',
                );
            }

            validateDisplayOrder(this.prisma, dto.display_order, position.max_banners, bannerId);
        }

        return {
            ...(dto.destination_link !== undefined && {
                destination_link: dto.destination_link,
            }),
            ...(dto.start_date !== undefined && { start_date: startDate }),
            ...(dto.end_date !== undefined && { end_date: endDate ?? undefined }),
            ...(dto.renewal_strategy !== undefined && { renewal_strategy: dto.renewal_strategy }),
            ...(dto.renewal_period !== undefined && dto.renewal_strategy === RenewalStrategy.automatic && {
                renewal_period: dto.renewal_period!,
            }),
            ...(dto.position_id !== undefined && { position_id: position.id }),
            ...(dto.display_order != null && { display_order: dto.display_order }),
            ...(secureUrl && { image_url: secureUrl }),
        };
    }

}