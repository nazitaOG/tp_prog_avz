import { BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

const validateCountLogger = new Logger('validateBannerCount');

export async function validateBannerCount(
    prisma: PrismaService,
    positionId: number,
    newStart: Date,
    newEnd: Date | null,
    max: number,
    excludeId?: string,
) {
    // base filter (position + possible exclusion)  
    const baseFilter: any = {
        position_id: positionId,
        NOT: excludeId ? { id: excludeId } : undefined,
    };

    // dynamically build the where clause for the count
    const whereClause = newEnd == null
        ? {
            ...baseFilter,
            AND: [
                {
                    OR: [
                        { end_date: null },             // banners undefined
                        { end_date: { gt: newStart } }, // or that expire after newStart
                    ],
                },
            ],
        }
        : {
            ...baseFilter,
            AND: [
                { start_date: { lte: newEnd } },   // that started in or before newEnd
                {
                    OR: [
                        { end_date: null },            // undefined
                        { end_date: { gte: newStart } },// or that expire in or after newStart
                    ],
                },
            ],
        };

    const overlapping = await prisma.banner.count({ where: whereClause });

    if (overlapping >= max) {
        validateCountLogger.error(
            `Limit reached: ${overlapping} banners overlapping in position ${positionId} (max=${max})`
        );
        throw new BadRequestException(
            'The maximum number of active banners has been reached in that date range',
        );
    }
}
