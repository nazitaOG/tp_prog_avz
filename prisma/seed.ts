import { PrismaClient, RenewalStrategy } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {

    if (process.env.NODE_ENV !== 'development') {
        console.error(
            '⛔️ Seeding solo permitido en development. NODE_ENV=',
            process.env.NODE_ENV
        );
        process.exit(1);
    }
    // Delete all data respecting relationships (from child to parent)
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

    // Create roles
    const adminRole = await prisma.role.create({ data: { name: 'admin' } });
    const advertiserRole = await prisma.role.create({ data: { name: 'advertiser' } });
    const userRole = await prisma.role.create({ data: { name: 'user' } });

    // Create permissions
    const permissions = ['create_banner', 'delete_user', 'view_reports', 'read_only'];
    for (const name of permissions) {
        await prisma.permission.create({ data: { name } });
    }

    // Assign all permissions to admin
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
        await prisma.rolePermission.create({
            data: {
                role_id: adminRole.id,
                permission_id: permission.id,
            },
        });
    }

    // Assign one permission to advertiser
    const createBannerPermission = await prisma.permission.findFirst({ where: { name: 'create_banner' } });
    if (createBannerPermission) {
        await prisma.rolePermission.create({
            data: {
                role_id: advertiserRole.id,
                permission_id: createBannerPermission.id,
            },
        });
    }

    // Assign one permission to user
    const readOnlyPermission = await prisma.permission.findFirst({ where: { name: 'read_only' } });
    if (readOnlyPermission) {
        await prisma.rolePermission.create({
            data: {
                role_id: userRole.id,
                permission_id: readOnlyPermission.id,
            },
        });
    }

    // Create positions
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

    // Create admin user
    const password = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@example.com',
            hashed_password: password,
        },
    });

    await prisma.userRole.create({
        data: {
            user_id: adminUser.id,
            role_id: adminRole.id,
        },
    });

    // Create advertiser user
    const advertiserPassword = await bcrypt.hash('advertiser123', 10);
    const advertiserUser = await prisma.user.create({
        data: {
            name: 'Advertiser',
            email: 'advertiser@example.com',
            hashed_password: advertiserPassword,
        },
    });

    await prisma.userRole.create({
        data: {
            user_id: advertiserUser.id,
            role_id: advertiserRole.id,
        },
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = await prisma.user.create({
        data: {
            name: 'User',
            email: 'user@example.com',
            hashed_password: userPassword,
        },
    });

    await prisma.userRole.create({
        data: {
            user_id: normalUser.id,
            role_id: userRole.id,
        },
    });

    // Create test banner
    await prisma.banner.create({
        data: {
            image_url: 'https://example.com/banner.jpg',
            destination_link: 'https://cliente.com',
            start_date: new Date(),
            renewal_strategy: RenewalStrategy.manual,
            user_id: adminUser.id,
            position_id: encabezado.id, // 🔧 Corregido
        },
    });
}

main()
    .catch((e) => {
        console.error('❌ Error in seed:', e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
