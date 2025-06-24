// src/banners/validations/banner.validator.ts


/////// tratar de factorizar mejor esta hecho un asco este codigo
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RenewalStrategy } from '@prisma/client';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { UpdateBannerDto } from '../dto/update-banner.dto';

@Injectable()
export class BannerValidator {
    private readonly logger = new Logger(BannerValidator.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Validación completa para creación de banners.
     */
    async validateCreate(dto: CreateBannerDto) {
        this.logger.log('Validating banner creation DTO');

        const start_date = dto.start_date ?? new Date();
        const end_date = dto.end_date ?? null;

        this.validateDates(start_date, end_date);
        this.validateRenewalPeriod(dto.renewal_strategy, dto.renewal_period);

        const position = await this.getPositionOrFail(dto.position_id);
        await this.validateBannerCount(
            position.id,
            start_date,
            position.max_banners,
        );
        // aquí dto.display_order puede ser undefined
        await this.validateDisplayOrderIfNeeded(
            dto.display_order,
            position.max_banners,
        );

        return {
            image_url: dto.image_url,
            destination_link: dto.destination_link,
            start_date,
            end_date,
            renewal_strategy:
                (dto.renewal_strategy as RenewalStrategy) ?? RenewalStrategy.manual,
            renewal_period:
                dto.renewal_strategy === RenewalStrategy.automatic
                    ? dto.renewal_period
                    : null,
            user_id: dto.user_id,
            position_id: position.id,
            display_order: dto.display_order,
        };
    }

    /**
     * Validación para actualización de banners.
     * Reglas de negocio idénticas a `validateCreate`, pero:
     *  - excluye el propio banner del conteo de activos
     *  - sólo valida display_order si viene en el DTO
     */
    async validateUpdate(
        dto: UpdateBannerDto,
        bannerId: string,
    ): Promise<UpdateBannerDto> {
        this.logger.log(`Validating update for banner ${bannerId}`);

        // 1) Obtener banner existente
        const existing = await this.prisma.banner.findUnique({
            where: { id: bannerId },
            select: {
                start_date: true,
                end_date: true,
                position_id: true,
            },
        });
        if (!existing) {
            throw new NotFoundException(`Banner ${bannerId} not found`);
        }

        // 2) Validar rango de fechas
        const start_date = dto.start_date ?? existing.start_date;
        const end_date = dto.end_date ?? existing.end_date ?? null;
        this.validateDates(start_date, end_date);

        // 3) Si viene renovación, validar estrategia y periodo
        if (dto.renewal_strategy) {
            if (
                !Object.values(RenewalStrategy).includes(
                    dto.renewal_strategy as RenewalStrategy,
                )
            ) {
                this.logger.error(
                    `Invalid renewal_strategy: ${dto.renewal_strategy}`,
                );
                throw new BadRequestException(
                    `Invalid renewal_strategy: ${dto.renewal_strategy}`,
                );
            }
            this.validateRenewalPeriod(
                dto.renewal_strategy as RenewalStrategy,
                dto.renewal_period,
            );
        }

        // 4) Determinar qué posición validar
        const positionId = dto.position_id ?? existing.position_id;
        const position = await this.getPositionOrFail(positionId);

        // ──────────────── AÑADIDO ────────────────
        // 4.1) Si la posición admite >1 banners, force require display_order:
        if (position.max_banners > 1 && dto.display_order == null) {
            this.logger.error(
                `display_order is required when position ${positionId} allows multiple banners`
            );
            throw new BadRequestException(
                'display_order is required when position allows multiple banners'
            );
        }
        // ──────────────────────────────────────────


        // 5) Contar banners activos excluyendo este mismo
        await this.validateBannerCount(
            position.id,
            start_date,
            position.max_banners,
            bannerId,
        );

        // 6) Sólo si envían display_order, validarlo correctamente
        if (dto.display_order != null) {
            // 6.a) no permitir en posiciones de solo 1 banner
            if (position.max_banners <= 1) {
                this.logger.error(
                    `display_order not allowed for position ${position.id} (max_banners=1)`,
                );
                throw new BadRequestException(
                    'display_order is not allowed when position allows only one banner',
                );
            }
            // 6.b) TS sabe que aquí dto.display_order es number
            const order: number = dto.display_order;
            await this.validateDisplayOrderIfNeeded(
                order,
                position.max_banners,
                bannerId,
            );
        }

        return dto;
    }

    // -------------------- Helpers privados --------------------

    private validateDates(start: Date, end: Date | null) {
        if (end && end <= start) {
            this.logger.error(
                `Invalid date range: start_date=${start.toISOString()}, end_date=${end.toISOString()}`,
            );
            throw new BadRequestException(
                'end_date must be after start_date',
            );
        }
    }

    private validateRenewalPeriod(
        strategy: RenewalStrategy,
        period?: number,
    ) {
        if (strategy === RenewalStrategy.automatic) {
            if (!period) {
                this.logger.error(
                    'Missing renewal_period for automatic strategy',
                );
                throw new BadRequestException('renewal_period is required');
            }
            if (![30, 60, 90].includes(period)) {
                this.logger.error(`Invalid renewal_period: ${period}`);
                throw new BadRequestException(
                    'renewal_period must be 30, 60, or 90',
                );
            }
        }
    }

    private async getPositionOrFail(id: number) {
        const position = await this.prisma.position.findUnique({
            where: { id },
        });
        if (!position) {
            this.logger.error(`Position with id ${id} not found`);
            throw new BadRequestException('Position not found');
        }
        return position;
    }

    private async validateBannerCount(
        positionId: number,
        start: Date,
        max: number,
        excludeId?: string,
    ) {
        const count = await this.prisma.banner.count({
            where: {
                position_id: positionId,
                OR: [
                    { end_date: null },
                    { end_date: { gte: start } },
                ],
                NOT: excludeId ? { id: excludeId } : undefined,
            },
        });
        if (count >= max) {
            this.logger.error(
                `Banner limit reached for position ${positionId} (max=${max})`,
            );
            throw new BadRequestException(
                'Max active banners reached for this position',
            );
        }
    }

    /**
     * Ahora acepta `order` siempre como number,
     * y permite pasar `undefined` desde validateCreate.
     */
    private async validateDisplayOrderIfNeeded(
        order: number | undefined,
        maxBanners: number,
        excludeId?: string,
    ) {
        if (maxBanners <= 1) return;

        if (order == null) {
            this.logger.error('display_order is required but not provided');
            throw new BadRequestException(
                'display_order is required when position allows multiple banners',
            );
        }

        if (order <= 0 || order > maxBanners) {
            this.logger.error(
                `display_order out of range: received=${order}, max=${maxBanners}`,
            );
            throw new BadRequestException(
                `display_order must be between 1 and ${maxBanners}`,
            );
        }

        const conflict = await this.prisma.banner.findFirst({
            where: {
                display_order: order,
                position: { max_banners: maxBanners },
                NOT: excludeId ? { id: excludeId } : undefined,
            },
        });
        if (conflict) {
            this.logger.error(
                `display_order ${order} already used in position with max_banners=${maxBanners}`,
            );
            throw new BadRequestException(
                `display_order ${order} already used in this position`,
            );
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
