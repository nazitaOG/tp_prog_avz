import { BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

const validateOrderLogger = new Logger('validateDisplayOrder');

export async function validateDisplayOrder(
    prisma: PrismaService,
    order: number | undefined,
    maxBanners: number,
    positionId: number,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string
) {
    if (maxBanners <= 1) return;

    if (order == null) {
        validateOrderLogger.error('display_order is required but not provided');
        throw new BadRequestException(
            'display_order is required when position allows multiple banners'
        );
    }

    if (order <= 0 || order > maxBanners) {
        validateOrderLogger.error(
            `display_order out of range: received=${order}, max=${maxBanners}`
        );
        throw new BadRequestException(
            `display_order must be between 1 and ${maxBanners}`
        );
    }

    const baseFilter: any = {
        display_order: order,
        position_id: positionId,
        NOT: excludeId ? { id: excludeId } : undefined,
    };

    const whereClause = endDate == null
        ? {
            ...baseFilter,
            AND: [
                {
                    OR: [
                        { end_date: null },
                        { end_date: { gt: startDate } },
                    ],
                },
            ],
        }
        : {
            ...baseFilter,
            AND: [
                { start_date: { lte: endDate } },
                {
                    OR: [
                        { end_date: null },
                        { end_date: { gte: startDate } },
                    ],
                },
            ],
        };

    const conflict = await prisma.banner.findFirst({ where: whereClause });

    if (conflict) {
        validateOrderLogger.error(
            `display_order ${order} already used in position ${positionId} during active date range`
        );
        throw new BadRequestException(
            `display_order ${order} already used in this position and date range`
        );
    }
}
