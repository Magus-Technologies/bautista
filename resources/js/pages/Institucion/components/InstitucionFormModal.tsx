import { School, Image as ImageIcon, ShieldCheck, CheckCircle2, Upload } from 'lucide-react';
import FormField from '@/components/shared/FormField';
import PasswordInput from '@/components/shared/password-input';
import TitleForm from '@/components/TitleForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Institucion, InstitucionFormData } from '../hooks/useInstitucion';
import { useInstitucionForm } from '../hooks/useInstitucionForm';


type Props = {
    open:        boolean;
    onClose:     () => void;
    editing:     Institucion | null;
    onSave:      (data: FormData) => Promise<void>;
    apiErrors:   Record<string, string[]>;
    clearErrors: () => void;
};

export default function InstitucionFormModal({ open, onClose, editing, onSave, apiErrors, clearErrors }: Props) {
    const { form, set, logoFile, setLogoFile, pemFile, setPemFile, pemInputRef, fileInputRef, processing, handleSubmit } =
        useInstitucionForm({ editing, open, onSave, onClose, clearErrors });

    const err = (key: keyof InstitucionFormData | 'logo') => apiErrors[key]?.[0];

    const logoPreview = logoFile
        ? URL.createObjectURL(logoFile)
        : editing?.insti_logo ?? null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-5 border-b">
                    <DialogTitle className="text-xl font-black text-neutral-900 flex items-center gap-2">
                        <School className="w-5 h-5 text-emerald-600" />
                        {editing ? 'Editar Institución' : 'Nueva Institución'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Sección: Identificación */}
                    <div className="space-y-4">
                        <TitleForm className="border-b border-neutral-100">
                            Datos de Identificación
                        </TitleForm>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Razón Social *"
                                value={form.insti_razon_social}
                                onChange={(v) => set('insti_razon_social', v)}
                                error={err('insti_razon_social')}
                                placeholder="Ej: IEP BAUTISTA LA PASCANA"
                            />
                            <FormField
                                label="RUC"
                                value={form.insti_ruc}
                                onChange={(v) => set('insti_ruc', v)}
                                error={err('insti_ruc')}
                                placeholder="Ej: 20123456789"
                            />
                            <div className="col-span-2">
                                <FormField
                                    label="Dirección"
                                    value={form.insti_direccion}
                                    onChange={(v) => set('insti_direccion', v)}
                                    error={err('insti_direccion')}
                                    placeholder="Ej: Jr. Abraham Valdelomar 496, Comas"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Contacto */}
                    <div className="space-y-4">
                        <TitleForm className="border-b border-neutral-100">
                            Contacto Directo
                        </TitleForm>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Teléfono 1"
                                value={form.insti_telefono1}
                                onChange={(v) => set('insti_telefono1', v)}
                                error={err('insti_telefono1')}
                                placeholder="Ej: 933 862 652"
                            />
                            <FormField
                                label="Teléfono 2"
                                value={form.insti_telefono2}
                                onChange={(v) => set('insti_telefono2', v)}
                                error={err('insti_telefono2')}
                                placeholder="Ej: 01 5551234"
                            />
                            <div className="col-span-2">
                                <FormField
                                    label="Correo Electrónico"
                                    value={form.insti_email}
                                    onChange={(v) => set('insti_email', v)}
                                    error={err('insti_email')}
                                    type="email"
                                    placeholder="Ej: contacto@colegio.edu.pe"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Director */}
                    <div className="space-y-4">
                        <TitleForm className="border-b border-neutral-100">
                            Información del Director
                        </TitleForm>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Nombre del Director"
                                value={form.insti_director}
                                onChange={(v) => set('insti_director', v)}
                                error={err('insti_director')}
                                placeholder="Ej: Lic. Elizabeth Llactarimay"
                            />
                            <FormField
                                label="DNI del Director"
                                value={form.insti_ndni}
                                onChange={(v) => set('insti_ndni', v)}
                                error={err('insti_ndni')}
                                placeholder="Ej: 12345678"
                            />
                        </div>
                    </div>

                    {/* Sección: SUNAT / Facturación Electrónica */}
                    <div className="space-y-4">
                        <TitleForm className="border-b border-neutral-100">
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                Facturación Electrónica (SUNAT)
                            </span>
                        </TitleForm>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Usuario SOL"
                                value={form.insti_sunat_usuario}
                                onChange={(v) => set('insti_sunat_usuario', v)}
                                error={apiErrors['insti_sunat_usuario']?.[0]}
                                placeholder="Ej: MODDATOS"
                            />
                            <div className="space-y-1">
                                <Label htmlFor="clave_sol" className="text-sm font-medium text-neutral-700">
                                    Clave SOL
                                </Label>
                                <PasswordInput
                                    id="clave_sol"
                                    value={form.insti_sunat_clave}
                                    onChange={(e) => set('insti_sunat_clave', e.target.value)}
                                    placeholder="Ej: moddatos"
                                    className="h-9"
                                />
                                {apiErrors['insti_sunat_clave']?.[0] && (
                                    <p className="text-xs text-rose-600 font-medium">
                                        {apiErrors['insti_sunat_clave'][0]}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Entorno SUNAT</label>
                            <select
                                value={form.insti_sunat_endpoint}
                                onChange={(e) => set('insti_sunat_endpoint', e.target.value)}
                                className="w-full h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="beta">Beta (Pruebas)</option>
                                <option value="production">Production (Real)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">
                                Certificado Digital (.pem)
                            </label>
                            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                <Upload className="w-5 h-5 text-neutral-400 shrink-0" />
                                <div className="flex-1">
                                    <input
                                        ref={pemInputRef}
                                        type="file"
                                        accept=".pem,.txt"
                                        className="block w-full text-sm text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        onChange={(e) => setPemFile(e.target.files?.[0] ?? null)}
                                    />
                                    {pemFile && (
                                        <p className="text-xs text-blue-600 mt-1 font-medium">{pemFile.name}</p>
                                    )}
                                </div>
                                {editing?.insti_certificado_enviado && !pemFile && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Enviado
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                Solo si vas a cambiar el certificado. Se enviará automáticamente a la API SUNAT al guardar.
                            </p>
                        </div>
                    </div>

                    {/* Sección: Logo */}
                    <div className="space-y-4 pb-4">
                        <TitleForm className="border-b border-neutral-100">
                            Logotipo Institución
                        </TitleForm>
                        <div className="flex items-center gap-6 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                            <div className="relative group">
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Logo"
                                        className="h-24 w-24 rounded-xl object-contain bg-white border border-neutral-200 p-2 shadow-sm transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-xl bg-white border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">
                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="block">
                                    <span className="sr-only">Elegir logo</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer transition-colors"
                                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {err('logo') && <p className="text-xs text-rose-600 font-medium">{err('logo')}</p>}
                                <p className="text-[11px] text-neutral-400 font-medium">PNG, JPG o GIF. Recomendado: 512x512px (Máx. 5 MB)</p>
                            </div>
                        </div>
                    </div>
                </form>

                <DialogFooter className="p-6 border-t bg-neutral-50/50">
                    <Button type="button" variant="ghost" onClick={onClose} className="font-bold text-neutral-500 hover:text-neutral-700">
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={processing} 
                        onClick={(e) => {
                            e.preventDefault();
                            handleSubmit(e as any);
                        }}
                        className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-8 rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                    >
                        {processing ? 'Guardando...' : 'Guardar Información'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

