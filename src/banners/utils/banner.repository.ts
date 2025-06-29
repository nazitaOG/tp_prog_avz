import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Banner } from '@prisma/client';

@Injectable()
export class BannerRepository {
    constructor(private readonly prisma: PrismaService) { }

    async getExpiringInDays(days: number): Promise<(Banner & { user: any })[]> {
        const today = new Date();
        const target = new Date(today);
        target.setDate(today.getDate() + days);
        return this.prisma.banner.findMany({
            where: { end_date: target, notified: false },
            include: { user: true },
        });
    }

    async getExpiredBefore(date: Date): Promise<(Banner & { user: any })[]> {
        return this.prisma.banner.findMany({
            where: { end_date: { lt: date } },
            include: { user: true },
        });
    }

    async getPendingAutoRenewal(): Promise<(Banner & { user: any })[]> {
        return this.prisma.banner.findMany({
            where: { end_date: null },
            include: { user: true },
        });
    }

    markNotified(id: string) {
        return this.prisma.banner.update({ where: { id }, data: { notified: true } });
    }

    updateRenewalDate(id: string, renewalDate: Date) {
        return this.prisma.banner.update({
            where: { id },
            data: { start_date: renewalDate, end_date: null },
        });
    }

    deleteById(id: string) {
        return this.prisma.banner.delete({ where: { id } });
    }
}