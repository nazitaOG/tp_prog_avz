// import { BadRequestException, Logger } from '@nestjs/common';
// import { CreateBannerDto } from '../dto/create-banner.dto';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { RenewalStrategy } from '@prisma/client';

// export async function validateBannerCreation(
//     dto: CreateBannerDto,
//     prisma: PrismaService,
// ) {
//     const start_date = dto.start_date ?? new Date();
//     const end_date = dto.end_date ?? null;

//     if (dto.renewal_strategy === RenewalStrategy.manual && !end_date) {
//         throw new BadRequestException('end_date is required when renewal_strategy is manual');
//     }

//     if (end_date && end_date <= start_date) {
//         throw new BadRequestException('end_date must be after start_date');
//     }

//     if (dto.renewal_strategy === RenewalStrategy.automatic) {
//         if (!dto.renewal_period) {
//             throw new BadRequestException('renewal_period is required when renewal_strategy is automatic');
//         }

//         if (![30, 60, 90].includes(dto.renewal_period)) {
//             throw new BadRequestException('renewal_period must be one of 30, 60, or 90');
//         }
//     }

//     const position = await prisma.position.findUnique({
//         where: { id: dto.position_id },
//     });

//     if (!position) {
//         throw new BadRequestException('Position not found');
//     }

//     const activeBannersCount = await prisma.banner.count({
//         where: {
//             position_id: dto.position_id,
//             end_date: {
//                 gte: start_date,
//             },
//         },
//     });

//     if (activeBannersCount >= position.max_banners) {
//         throw new BadRequestException('Position already has the maximum number of active banners');
//     }

//     if (position.allows_order) {
//         if (dto.display_order === undefined || dto.display_order === null) {
//             throw new BadRequestException('display_order is required when position allows ordering');
//         }

//         if (dto.display_order <= 0 || dto.display_order > position.max_banners) {
//             throw new BadRequestException(`display_order must be between 1 and ${position.max_banners}`);
//         }

//         const conflictingBanner = await prisma.banner.findFirst({
//             where: {
//                 position_id: dto.position_id,
//                 display_order: dto.display_order,
//             },
//         });

//         if (conflictingBanner) {
//             throw new BadRequestException(
//                 `Another banner already uses display_order ${dto.display_order} in this position`
//             );
//         }
//     }

//     return {
//         image_url: dto.image_url,
//         destination_link: dto.destination_link,
//         start_date,
//         end_date,
//         renewal_strategy: dto.renewal_strategy ?? RenewalStrategy.manual,
//         renewal_period:
//             dto.renewal_strategy === RenewalStrategy.automatic ? dto.renewal_period : null,
//         user_id: dto.user_id,
//         position_id: dto.position_id,
//         display_order: dto.display_order,
//     };
// }



// // "image_url": "https://i.imgur.com/banner-test.jpg",
// //   "destination_link": "https://cliente-ejemplo.com",
// //   "start_date": "2025-06-21",
// //   "end_date": "2025-07-21",
// //   "renewal_strategy": "automatic",
// //   "renewal_period": 60,
// //   "display_order": 1,
// //   "user_id": "3a35427a-2660-4bee-8b34-0eee3103378c",
// //   "position_id": 1
