import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { UserPlus, Mail, Shield, Building2, Trash2, Edit2, X, Check } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { clsx } from 'clsx';

function Field({ label, error, children }) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {children}
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </label>
    );
}

function UserModal({ user, tenants, onClose }) {
    const isEditing = !!user;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'photographer',
        tenant_id: user?.tenant_id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/saas/users/${user.id}`, {
                onSuccess: () => onClose(),
            });
        } else {
            post('/admin/saas/users', {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[2.5rem] border border-[#e6e0d5] bg-white p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#171411] text-white">
                            {isEditing ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Editar usuario' : 'Nuevo usuario manual'}</h3>
                            <p className="text-sm text-slate-500">Completa los datos de acceso.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-100 transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Nombre completo" error={errors.name}>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors" placeholder="Ej. Juan Perez" />
                        </Field>
                        <Field label="Correo electronico" error={errors.email}>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors" placeholder="juan@estudio.com" />
                        </Field>
                    </div>

                    <Field label={isEditing ? 'Nueva clave (opcional)' : 'Contraseña inicial'} error={errors.password}>
                        <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors" placeholder="Minimo 8 caracteres" />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Rol en el sistema" error={errors.role}>
                            <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors">
                                <option value="photographer">Fotografo (Tenant)</option>
                                <option value="owner">Dueño (Tenant)</option>
                                <option value="operator">Operador (Global)</option>
                                <option value="developer">Developer (Global)</option>
                            </select>
                        </Field>
                        <Field label="Asignar a Tenant" error={errors.tenant_id}>
                            <select 
                                value={data.tenant_id} 
                                onChange={e => setData('tenant_id', e.target.value)} 
                                disabled={isEditing && !!user.tenant_id}
                                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors disabled:opacity-50"
                            >
                                <option value="">Sin tenant (Acceso global)</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </Field>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-[#e6e0d5] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 rounded-2xl bg-[#171411] text-sm font-semibold text-white hover:bg-black transition-all disabled:opacity-60 flex items-center gap-2">
                            {processing ? 'Procesando...' : (isEditing ? 'Guardar cambios' : 'Crear usuario')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ users, tenants }) {
    const [modalUser, setModalUser] = React.useState(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('¿Estas seguro de eliminar este usuario? Perderá acceso inmediato.')) {
            destroy(`/admin/saas/users/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="SaaS - Usuarios" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[2rem] bg-[#fbf9f6] border border-[#e6e0d5] shadow-sm">
                            <Shield className="h-6 w-6 text-slate-700" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Control de Usuarios</h2>
                            <p className="text-sm text-slate-500">Gestiona accesos de fotógrafos y administradores globales.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black shadow-sm"
                    >
                        <UserPlus className="h-4 w-4" />
                        Crear usuario manual
                    </button>
                </div>

                <div className="rounded-[2.5rem] border border-[#e6e0d5] bg-white overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#f3eee6] bg-[#fcfaf7]">
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Nombre / Email</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Tenant / Origen</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Rol</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f3eee6]">
                                {users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-[#fcfaf7] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1ebe1] text-xs font-bold text-slate-700 group-hover:bg-white transition-colors">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                                                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">{user.tenant_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={clsx(
                                                'inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                                                ['developer', 'operator'].includes(user.role) ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModalUser(user)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e6e0d5] text-slate-600 hover:text-slate-900 hover:shadow-sm transition-all">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#e6e0d5] text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isCreateOpen && <UserModal tenants={tenants} onClose={() => setIsCreateOpen(false)} />}
            {modalUser && <UserModal user={modalUser} tenants={tenants} onClose={() => setModalUser(null)} />}
        </AdminLayout>
    );
}
