import type { CrudConfig } from '@/components/crud/crud-types';
import { ResourceCrudPage } from '@/components/crud/resource-crud-page';
import type { ExportColumn } from '@/lib/export-xlsx';
import { destroy, store, update } from '@/routes/users';
import type { EnumOption, User } from '@/types';

interface UsersIndexProps {
    users: User[];
    roleOptions: EnumOption[];
}

const userColumns: ExportColumn<User>[] = [
    { header: 'User ID', value: (user) => user.user_id ?? '' },
    { header: 'Name', value: (user) => user.name },
    { header: 'Email', value: (user) => user.email },
    { header: 'Type', value: (user) => user.type_label },
    {
        header: 'Status',
        value: (user) => (user.is_active ? 'Active' : 'Inactive'),
    },
];

export default function UsersIndex({ users, roleOptions }: UsersIndexProps) {
    const config: CrudConfig<User> = {
        title: 'Users',
        entityLabel: 'User',
        filename: 'users',
        emptyText: 'No users yet.',
        pk: (user) => user.id,
        defaultSortKey: 'name',
        exportColumns: userColumns,
        editTitle: (user) => user.name,
        deleteLabel: (user) => `${user.name} (${user.user_id ?? user.id})`,
        columns: [
            {
                header: 'User ID',
                sortKey: 'user_id',
                cell: (user) => user.user_id ?? '—',
            },
            {
                header: 'Name',
                sortKey: 'name',
                cell: (user) => user.name,
                className: 'font-medium',
            },
            { header: 'Email', sortKey: 'email', cell: (user) => user.email },
            {
                header: 'Role',
                sortKey: 'type_label',
                cell: (user) => user.type_label,
            },
            {
                header: 'Status',
                sortKey: 'is_active',
                cell: (user) => (
                    <span
                        className={
                            user.is_active
                                ? 'text-green-600'
                                : 'text-red-600'
                        }
                    >
                        {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                ),
            },
        ],
        fields: [
            { name: 'name', label: 'Name' },
            { name: 'email', label: 'Email', type: 'email' },
            {
                name: 'type',
                label: 'Role',
                type: 'select',
                options: roleOptions,
            },
            { name: 'user_id', label: 'User ID' },
            {
                name: 'password',
                label: 'Password (leave blank to keep current)',
                type: 'password',
            },
        ],
        toFormData: (user) => ({
            name: user?.name ?? '',
            email: user?.email ?? '',
            type: user?.type ?? 'sales',
            user_id: user?.user_id ?? '',
            password: "[redacted]"
        }),
        routes: {
            store: () => store(),
            update: (id) => update({ user: id as string }),
            destroy: (id) => destroy({ user: id as string }),
        },
    };

    return <ResourceCrudPage rows={users} config={config} />;
}

UsersIndex.layout = {
    title: 'Users',
};
