import { UserWithRoles } from './user-with-role.interface';
import { UserRole } from '@prisma/client';

describe('UserWithRoles Interface', () => {
    it('should accept a valid UserWithRoles object and preserve its shape', () => {
        const assignedAt = new Date();
        const roles: UserRole[] = [
            {
                user_id: '1',
                role_id: 1,
                assigned_at: assignedAt,
            },
        ];

        const user: UserWithRoles = {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            roles,
        };

        expect(user).toBeDefined();
        expect(user.id).toBe('1');
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john.doe@example.com');

        expect(Array.isArray(user.roles)).toBe(true);
        expect(user.roles).toHaveLength(1);

        const role = user.roles[0];
        expect(role).toMatchObject<UserRole>({
            user_id: '1',
            role_id: 1,
            assigned_at: assignedAt,
        });

        expect(typeof role.user_id).toBe('string');
        expect(typeof role.role_id).toBe('number');
        expect(role.assigned_at instanceof Date).toBe(true);
    });

    it('should accept multiple roles', () => {
        const assignedAt = new Date();
        const roles: UserRole[] = [
            {
                user_id: '1',
                role_id: 1,
                assigned_at: assignedAt,
            },
            {
                user_id: '1',
                role_id: 2,
                assigned_at: assignedAt,
            },
        ];

        const user: UserWithRoles = {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            roles,
        };

        expect(Array.isArray(user.roles)).toBe(true);
        expect(user.roles).toHaveLength(2);
    });
});
