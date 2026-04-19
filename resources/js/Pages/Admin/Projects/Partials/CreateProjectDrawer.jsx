import React from 'react';
import { useForm } from '@inertiajs/react';
import { Drawer, Input, Button } from '@/Components/UI';
import { FolderKanban, User, Plus } from 'lucide-react';

export default function CreateProjectDrawer({ isOpen, onClose }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        client_name: '',
        project_name: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/projects', {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <Drawer 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Nueva Colección Directa"
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
                    <p className="text-xs text-primary font-medium leading-relaxed">
                        Crea un proyecto sin necesidad de un lead previo. Ideal para sesiones rápidas o trabajos por fuera del CRM.
                    </p>
                </div>

                <div className="space-y-4">
                    <Input 
                        label="Nombre del Cliente" 
                        icon={User}
                        value={data.client_name}
                        onChange={e => setData('client_name', e.target.value)}
                        error={errors.client_name}
                        placeholder="Ej. Maria Delgado"
                    />
                    <Input 
                        label="Título de la Colección" 
                        icon={FolderKanban}
                        value={data.project_name}
                        onChange={e => setData('project_name', e.target.value)}
                        error={errors.project_name}
                        placeholder="Ej. Sesión Exterior Abril"
                    />
                </div>

                <div className="pt-4 space-y-3">
                    <Button 
                        type="submit" 
                        className="w-full" 
                        loading={processing}
                        icon={Plus}
                    >
                        Generar Proyecto
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        El proyecto se creará con estado "Activo" de forma inmediata.
                    </p>
                </div>
            </form>
        </Drawer>
    );
}
