import { UserRole } from '@prisma/client';

export interface UserWithRoles {
    id: string;
    name: string;
    email: string;
    roles: UserRole[];
}
