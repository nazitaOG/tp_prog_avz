import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { UpdateBannerDto } from '../dto/update-banner.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RenewalStrategy } from '@prisma/client';

@Injectable()
export class BannerValidator {
    constructor(private readonly prisma: PrismaService) { }

    async validateCreate(dto: CreateBannerDto) {
        const start_date = dto.start_date ?? new Date();
        const end_date = dto.end_date ?? null;

        this.validateDates(start_date, end_date);
        this.validateRenewalPeriod(dto.renewal_strategy, dto.renewal_period);

        const position = await this.getPositionOrFail(dto.position_id);
        await this.validateBannerCount(position.id, start_date, position.max_banners);
        await this.validateDisplayOrderIfNeeded(dto.display_order, position.max_banners);

        return {
            image_url: dto.image_url,
            destination_link: dto.destination_link,
            start_date,
            end_date,
            renewal_strategy: dto.renewal_strategy ?? RenewalStrategy.manual,
            renewal_period: dto.renewal_strategy === RenewalStrategy.automatic ? dto.renewal_period : null,
            user_id: dto.user_id,
            position_id: position.id,
            display_order: dto.display_order,
        };
    }

    async validateUpdate(dto: UpdateBannerDto, bannerId: string) {
        const start_date = dto.start_date ?? (await this.getStartDateFromDB(bannerId));
        const end_date = dto.end_date ?? null;

        if (dto.renewal_strategy) {
            this.validateDates(start_date, end_date);
            this.validateRenewalPeriod(dto.renewal_strategy, dto.renewal_period);
        }

        if (dto.position_id) {
            const position = await this.getPositionOrFail(dto.position_id);
            await this.validateBannerCount(position.id, start_date, position.max_banners, bannerId);
            await this.validateDisplayOrderIfNeeded(dto.display_order, position.max_banners, bannerId);
        }

        return dto;
    }

    private validateDates(start: Date, end: Date | null) {
        if (end && end <= start) {
            throw new BadRequestException('end_date must be after start_date');
        }
    }

    private validateRenewalPeriod(strategy: RenewalStrategy, period?: number) {
        if (strategy === 'automatic') {
            if (!period) throw new BadRequestException('renewal_period is required');
            if (![30, 60, 90].includes(period)) {
                throw new BadRequestException('renewal_period must be 30, 60, or 90');
            }
        }
    }

    private async getPositionOrFail(id: number) {
        const position = await this.prisma.position.findUnique({ where: { id } });
        if (!position) throw new BadRequestException('Position not found');
        return position;
    }

    private async validateBannerCount(positionId: number, start: Date, max: number, excludeId?: string) {
        const count = await this.prisma.banner.count({
            where: {
                position_id: positionId,
                end_date: { gte: start },
                NOT: excludeId ? { id: excludeId } : undefined,
            },
        });

        if (count >= max) {
            throw new BadRequestException('Max active banners reached for this position');
        }
    }

    private async validateDisplayOrderIfNeeded(order: number | undefined | null, maxBanners: number, excludeId?: string) {
        if (maxBanners <= 1) return; 

        if (order === undefined || order === null) {
            throw new BadRequestException('display_order is required when position allows multiple banners');
        }

        if (order <= 0 || order > maxBanners) {
            throw new BadRequestException(`display_order must be between 1 and ${maxBanners}`);
        }

        const conflict = await this.prisma.banner.findFirst({
            where: {
                display_order: order,
                position: { max_banners: maxBanners },
                NOT: excludeId ? { id: excludeId } : undefined,
            },
        });

        if (conflict) {
            throw new BadRequestException(`display_order ${order} already used in this position`);
        }
    }

    private async getStartDateFromDB(id: string) {
        const banner = await this.prisma.banner.findUnique({
            where: { id },
            select: { start_date: true },
        });
        return banner?.start_date ?? new Date();
    }
}
