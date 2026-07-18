import React, { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Copy, KeyRound, Plus, Trash2, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
        >
            {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
        </button>
    );
}

export default function ApiTokens({ tokens }) {
    const { props } = usePage();
    const newToken = props.flash?.new_token;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        expires_in: '',
    });

    const handleCreate = (e) => {
        e.preventDefault();
        post('/admin/settings/api-tokens', {
            onSuccess: () => reset(),
        });
    };

    const handleRevoke = (tokenId) => {
        if (!confirm('¿Revocar este token? Las integraciones que lo usen dejarán de funcionar.')) return;
        router.delete(`/admin/settings/api-tokens/${tokenId}`);
    };

    return (
        <AdminLayout>
            <div className="max-w-3xl space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Tokens de API</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Genera tokens para conectar integraciones externas al API REST de tu estudio.
                        La URL base es <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">/api/v1</code>.
                    </p>
                </div>

                {/* Token recién creado */}
                {newToken && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            Token creado — cópialo ahora, no se mostrará de nuevo
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-white border border-green-200 px-4 py-3">
                            <code className="flex-1 break-all font-mono text-xs text-slate-700">{newToken}</code>
                            <CopyButton text={newToken} />
                        </div>
                    </div>
                )}

                {/* Formulario de creación */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-slate-700">Nuevo token</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Nombre descriptivo (ej: Zapier, CRM interno)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={clsx(
                                        'w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30',
                                        errors.name ? 'border-red-400' : 'border-slate-200 focus:border-primary'
                                    )}
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <select
                                value={data.expires_in}
                                onChange={(e) => setData('expires_in', e.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">Sin vencimiento</option>
                                <option value="30">30 días</option>
                                <option value="90">90 días</option>
                                <option value="365">1 año</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={processing || !data.name}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            {processing ? 'Creando…' : 'Crear token'}
                        </button>
                    </form>
                </div>

                {/* Lista de tokens */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h2 className="text-sm font-bold text-slate-700">Tokens activos ({tokens.length})</h2>
                    </div>

                    {tokens.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                            <KeyRound className="h-8 w-8 opacity-40" />
                            <p className="text-sm">No hay tokens creados todavía.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tokens.map((token) => (
                                <li key={token.id} className="flex items-center justify-between gap-4 px-6 py-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">{token.name}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Creado {new Date(token.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            {token.last_used_at && (
                                                <> · Último uso {new Date(token.last_used_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}</>
                                            )}
                                            {token.expires_at && (
                                                <> · Vence {new Date(token.expires_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(token.id)}
                                        className="flex-shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Revocar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Referencia rápida */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Uso rápido</h3>
                    <pre className="overflow-x-auto rounded-lg bg-slate-800 p-4 text-xs text-green-300">
{`curl -H "Authorization: Bearer TU_TOKEN" \\
     https://TU_DOMINIO/api/v1/me`}
                    </pre>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div><span className="font-bold text-slate-600">GET</span> /api/v1/projects</div>
                        <div><span className="font-bold text-slate-600">POST</span> /api/v1/projects</div>
                        <div><span className="font-bold text-slate-600">GET</span> /api/v1/leads</div>
                        <div><span className="font-bold text-slate-600">POST</span> /api/v1/leads</div>
                        <div><span className="font-bold text-slate-600">GET</span> /api/v1/invoices</div>
                        <div><span className="font-bold text-slate-600">PATCH</span> /api/v1/invoices/{'{id}'}/pay</div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
