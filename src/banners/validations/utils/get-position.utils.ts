import { BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

const getPositionLogger = new Logger('getPosition');

export async function getPosition(
    prisma: PrismaService,
    id: number
) {
    const position = await prisma.position.findUnique({ where: { id } });
    if (!position) {
        getPositionLogger.error(`Position with id ${id} not found`);
        throw new BadRequestException('Position not found');
    }
    return position;
}