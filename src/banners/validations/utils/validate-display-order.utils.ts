import { BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

const validateOrderLogger = new Logger('validateDisplayOrder');

export async function validateDisplayOrder(
    prisma: PrismaService,
    order: number | undefined,
    maxBanners: number,
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

    const conflict = await prisma.banner.findFirst({
        where: {
            display_order: order,
            position: { max_banners: maxBanners },
            NOT: excludeId ? { id: excludeId } : undefined,
        },
    });
    if (conflict) {
        validateOrderLogger.error(
            `display_order ${order} already used in position with max_banners=${maxBanners}`
        );
        throw new BadRequestException(
            `display_order ${order} already used in this position`
        );
    }
}