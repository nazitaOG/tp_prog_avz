import { PrismaClient, RenewalStrategy } from '@prisma/client';
import * as bcrypt from 'bcrypt';

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
    if (!['development'].includes(process.env.NODE_ENV || '')) {
        console.error('Seeding only allowed in development or test. NODE_ENV=', process.env.NODE_ENV);
        process.exit(1);
    }

    // Eliminar datos respetando relaciones
    await prisma.banner.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.position.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Role_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Permission_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Position_id_seq" RESTART WITH 1`);

    // Roles
    const adminRole = await prisma.role.create({ data: { name: 'admin' } });
    const advertiserRole = await prisma.role.create({ data: { name: 'advertiser' } });
    const userRole = await prisma.role.create({ data: { name: 'user' } });

    // Permisos
    const permissions = ['create_banner', 'delete_user', 'view_reports', 'read_only'];
    for (const name of permissions) {
        await prisma.permission.create({ data: { name } });
    }

    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
        await prisma.rolePermission.create({
            data: {
                role_id: adminRole.id,
                permission_id: permission.id,
            },
        });
    }

    const createBannerPermission = await prisma.permission.findFirst({ where: { name: 'create_banner' } });
    if (createBannerPermission) {
        await prisma.rolePermission.create({
            data: {
                role_id: advertiserRole.id,
                permission_id: createBannerPermission.id,
            },
        });
    }

    const readOnlyPermission = await prisma.permission.findFirst({ where: { name: 'read_only' } });
    if (readOnlyPermission) {
        await prisma.rolePermission.create({
            data: {
                role_id: userRole.id,
                permission_id: readOnlyPermission.id,
            },
        });
    }

    // Posiciones
    const flotante_principal = await prisma.position.create({
        data: { name: 'flotante principal', max_banners: 1 },
    });

    const encabezado = await prisma.position.create({
        data: { name: 'encabezado', max_banners: 1 },
    });

    const pie = await prisma.position.create({
        data: { name: 'pie', max_banners: 2 },
    });

    const lateral_derecho = await prisma.position.create({
        data: { name: 'lateral derecho', max_banners: 3 },
    });

    // Usuarios
    const password = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@example.com',
            hashed_password: password,
        },
    });
    await prisma.userRole.create({ data: { user_id: adminUser.id, role_id: adminRole.id } });

    const advertiserPassword = await bcrypt.hash('advertiser123', 10);
    const advertiserUser = await prisma.user.create({
        data: {
            name: 'Advertiser',
            email: 'advertiser@example.com',
            hashed_password: advertiserPassword,
        },
    });
    await prisma.userRole.create({ data: { user_id: advertiserUser.id, role_id: advertiserRole.id } });

    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = await prisma.user.create({
        data: {
            name: 'User',
            email: 'user@example.com',
            hashed_password: userPassword,
        },
    });
    await prisma.userRole.create({ data: { user_id: normalUser.id, role_id: userRole.id } });

    // Banners
    await prisma.banner.create({
        data: {
            image_url: 'https://example.com/banner.jpg',
            destination_link: 'https://adidas.com',
            start_date: new Date(),
            renewal_strategy: RenewalStrategy.manual,
            user_id: adminUser.id,
            position_id: encabezado.id,
        },
    });

    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 3);
    await prisma.banner.create({
        data: {
            image_url: 'https://example.com/banner2.jpg',
            destination_link: 'https://adidas.com',
            start_date: new Date(),
            end_date: expiringDate,
            renewal_strategy: RenewalStrategy.manual,
            user_id: advertiserUser.id,
            position_id: flotante_principal.id,
        },
    });

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    await prisma.banner.create({
        data: {
            image_url: 'https://example.com/banner3.jpg',
            destination_link: 'https://adidas.com',
            start_date: new Date(),
            end_date: expiredDate,
            renewal_strategy: RenewalStrategy.manual,
            user_id: advertiserUser.id,
            position_id: pie.id,
        },
    });
}

main()
    .catch((e) => {
        console.error('Error in seed:', e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
