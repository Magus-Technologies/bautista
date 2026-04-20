import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import type { MatriculaFormData, SeccionOption, GradoOption } from '../hooks/useMatricula';
import { defaultMatriculaForm } from '../hooks/useMatricula';
import AlumnoTab from './matricular/AlumnoTab';
import type { ConceptoCobro } from './matricular/AlumnoTab';
import ContactoTab from './matricular/ContactoTab';
import { defaultAlumno, defaultContacto, mapContacto } from './matricular/types';
import type { AlumnoForm, ContactoForm } from './matricular/types';

// ── Props ──────────────────────────────────────────────────────────────────────

type Props = {
    open:        boolean;
    onClose:     () => void;
    aperturaId:  number;
    nivelId?:    number | null;
    anio:        number;
    secciones:   SeccionOption[];
    grados:      GradoOption[];
    onSave:      (data: MatriculaFormData) => Promise<void>;
    onEditSave?: () => Promise<void>;
    apiErrors:   Record<string, string[]>;
    clearErrors: () => void;
    editingMatricula?: any | null;  // pre-fill for edit mode
    estudiantes?: any[];
};

const TAB_CLS = 'rounded-none border-b-2 border-transparent data-[state=active]:border-[#00a65a] data-[state=active]:bg-transparent data-[state=active]:text-[#00a65a] data-[state=active]:shadow-none px-4 py-2 text-sm font-medium';

// ── Component ──────────────────────────────────────────────────────────────────

export default function MatricularModal({
    open, onClose, aperturaId, nivelId, anio,
    secciones, grados, onSave, onEditSave, clearErrors, editingMatricula,
}: Props) {
    const [matricula, setMatricula]   = useState<MatriculaFormData>(defaultMatriculaForm);
    const [alumno, setAlumno]         = useState<AlumnoForm>(defaultAlumno());
    const [padre, setPadre]           = useState<ContactoForm>(defaultContacto());
    const [madre, setMadre]           = useState<ContactoForm>(defaultContacto());
    const [apoderado, setApoderado]   = useState<ContactoForm>(defaultContacto());
    const [searching, setSearching]   = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors]         = useState<Record<string, string>>({});
    const [dniSearch, setDniSearch]   = useState('');
    const [selectedGrado, setSelectedGrado] = useState('');
    const [conceptosCobro, setConceptosCobro] = useState<ConceptoCobro[]>([]);
    // track which estu_id we already loaded contacts for — avoids re-loading
    // when the user edits other fields and alumno.estu_id stays the same
    const loadedContactsFor = useRef<number | null>(null);

    // reset on open/close
    useEffect(() => {
        clearErrors();
        setErrors({});
        setDniSearch('');
        setSelectedGrado('');
        setConceptosCobro([]);
        loadedContactsFor.current = null;

        if (open && editingMatricula) {
            const s = editingMatricula.estudiante;
            setAlumno({
                estu_id:             s?.estu_id ?? null,
                username:            s?.doc_numero ?? '',
                email:               s?.email ?? '',
                primer_nombre:       s?.primer_nombre ?? '',
                segundo_nombre:      s?.segundo_nombre ?? '',
                apellido_paterno:    s?.apellido_paterno ?? '',
                apellido_materno:    s?.apellido_materno ?? '',
                genero:              s?.genero ?? '',
                fecha_nacimiento:    s?.fecha_nacimiento ?? '',
                edad:                s?.edad?.toString() ?? '',
                talla:               s?.talla ?? '',
                peso:                s?.peso ?? '',
                telefono:            s?.telefono ?? '',
                direccion:           s?.direccion ?? '',
                colegio:             s?.colegio ?? '',
                neurodivergencia:    s?.neurodivergencia ?? '',
                terapia_ocupacional: s?.terapia_ocupacional ?? '',
                seguro:              s?.seguro ?? '',
                seguro_privado:      s?.seguro_privado ?? '',
                mensualidad:         s?.mensualidad?.toString() ?? '',
                fecha_ingreso:       s?.fecha_ingreso ?? '',
                fecha_pago:          s?.fecha_promovido ?? s?.fecha_pago ?? '',
                dia_pago:            s?.dia_pago ?? null,
                foto:                null,
            });
            setMatricula({
                apertura_id: aperturaId.toString(),
                estu_id:     s?.estu_id?.toString() ?? '',
                seccion_id:  editingMatricula.seccion_id?.toString() ?? '',
                anio:        anio.toString(),
            });
            setSelectedGrado(editingMatricula.seccion?.grado?.grado_id?.toString() ?? '');
        } else {
            setMatricula({ ...defaultMatriculaForm, apertura_id: aperturaId.toString(), anio: anio.toString() });
            setAlumno(defaultAlumno());
        }

        setPadre(defaultContacto());
        setMadre(defaultContacto());
        setApoderado(defaultContacto());
    }, [open]);

    // auto-load contacts when an existing student is found by DNI — only once per student
    useEffect(() => {
        if (!alumno.estu_id) return;
        if (loadedContactsFor.current === alumno.estu_id) return; // already loaded
        loadedContactsFor.current = alumno.estu_id;

        api.get(`/estudiantes/${alumno.estu_id}/contactos`)
            .then(r => {
                const d = r.data;

                if (d.padre)     {
setPadre(mapContacto(d.padre));
}

                if (d.madre)     {
setMadre(mapContacto(d.madre));
}

                if (d.apoderado) {
setApoderado(mapContacto(d.apoderado));
}
            })
            .catch(() => {});
    }, [alumno.estu_id]);

    // ── DNI search ─────────────────────────────────────────────────────────────
    const handleDniSearch = async () => {
        if (!dniSearch.trim()) {
return;
}

        setSearching(true);

        try {
            const res = await api.get('/estudiantes', { params: { search: dniSearch.trim(), per_page: 5 } });
            const found = (res.data.data ?? [])[0];

            if (found) {
                setAlumno({
                    estu_id:             found.estu_id,
                    username:            found.user?.username ?? found.perfil?.doc_numero ?? '',
                    email:               found.user?.email ?? '',
                    primer_nombre:       found.perfil?.primer_nombre ?? '',
                    segundo_nombre:      found.perfil?.segundo_nombre ?? '',
                    apellido_paterno:    found.perfil?.apellido_paterno ?? '',
                    apellido_materno:    found.perfil?.apellido_materno ?? '',
                    genero:              found.perfil?.genero ?? '',
                    fecha_nacimiento:    found.perfil?.fecha_nacimiento ?? '',
                    edad:                found.edad?.toString() ?? '',
                    talla:               found.talla ?? '',
                    peso:                found.peso ?? '',
                    telefono:            found.perfil?.telefono ?? '',
                    direccion:           found.perfil?.direccion ?? '',
                    colegio:             found.colegio ?? '',
                    neurodivergencia:    found.neurodivergencia ?? '',
                    terapia_ocupacional: found.terapia_ocupacional ?? '',
                    seguro:              found.seguro ?? '',
                    seguro_privado:      found.seguro_privado ?? '',
                    mensualidad:         found.mensualidad ?? '',
                    fecha_ingreso:       found.fecha_ingreso ?? '',
                    fecha_pago:          found.fecha_pago ?? '',
                    dia_pago:            found.dia_pago ?? null,
                    foto:                null,
                });
                setMatricula(prev => ({ ...prev, estu_id: found.estu_id.toString() }));
            } else {
                // Si no existe localmente, buscar en RENIEC via APIPeru
                try {
                    const reniecRes = await api.get(`/reniec/dni/${dniSearch.trim()}`);

                    if (reniecRes.data.success) {
                        const d = reniecRes.data.data;
                        setAlumno({
                            ...defaultAlumno(),
                            username:         d.dni,
                            primer_nombre:    d.nombres?.split(' ')[0] ?? '',
                            segundo_nombre:   d.nombres?.split(' ').slice(1).join(' ') ?? '',
                            apellido_paterno: d.apellidoPaterno,
                            apellido_materno: d.apellidoMaterno,
                        });
                        setMatricula(prev => ({ ...prev, estu_id: '' }));
                    } else {
                        setAlumno({ ...defaultAlumno(), username: dniSearch.trim() });
                        setMatricula(prev => ({ ...prev, estu_id: '' }));
                    }
                } catch (e) {
                    setAlumno({ ...defaultAlumno(), username: dniSearch.trim() });
                    setMatricula(prev => ({ ...prev, estu_id: '' }));
                }
            }
        } finally {
            setSearching(false);
        }
    };

    const handleContactoSearch = async (tipo: 'padre' | 'madre' | 'apoderado', dni: string) => {
        if (!dni.trim()) {
return;
}

        setSearching(true);

        try {
            const res = await api.get(`/reniec/dni/${dni.trim()}`);

            if (res.data.success) {
                const d = res.data.data;
                const fn = tipo === 'padre' ? setPadre : tipo === 'madre' ? setMadre : setApoderado;
                fn(prev => ({
                    ...prev,
                    nombres:   d.nombres,
                    apellidos: `${d.apellidoPaterno} ${d.apellidoMaterno}`.trim(),
                    numero_doc: d.dni
                }));
            }
        } finally {
            setSearching(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const setM = (k: keyof MatriculaFormData, v: string) =>
        setMatricula(prev => ({ ...prev, [k]: v }));

    const setC = (tipo: 'padre' | 'madre' | 'apoderado', k: keyof ContactoForm, v: string | boolean) => {
        const fn = tipo === 'padre' ? setPadre : tipo === 'madre' ? setMadre : setApoderado;
        fn(prev => ({ ...prev, [k]: v }));
    };

    const buildAlumnoPayload = () => {
        // Si alumno.mensualidad fue reseteado (ej: búsqueda DNI), recuperar desde conceptos cargados
        const mensualConcepto = conceptosCobro.find(c => c.periodicidad === 'mensual' && c.incluido);
        const mensualidad = alumno.mensualidad || mensualConcepto?.monto_final.toFixed(2) || '';

        return {
            username: alumno.username, email: alumno.email,
            primer_nombre: alumno.primer_nombre, segundo_nombre: alumno.segundo_nombre,
            apellido_paterno: alumno.apellido_paterno, apellido_materno: alumno.apellido_materno,
            genero: alumno.genero, fecha_nacimiento: alumno.fecha_nacimiento,
            edad: alumno.edad, talla: alumno.talla, peso: alumno.peso,
            telefono: alumno.telefono, direccion: alumno.direccion,
            colegio: alumno.colegio, neurodivergencia: alumno.neurodivergencia,
            terapia_ocupacional: alumno.terapia_ocupacional, seguro: alumno.seguro,
            seguro_privado: alumno.seguro_privado, mensualidad,
            fecha_ingreso: alumno.fecha_ingreso,
            fecha_promovido: alumno.fecha_pago,
            foto: alumno.foto,
        };
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const errs: Record<string, string> = {};

        if (!alumno.username.trim())         {
errs.username         = 'El DNI es requerido';
}

        if (!alumno.primer_nombre.trim())    {
errs.primer_nombre    = 'Requerido';
}

        if (!alumno.apellido_paterno.trim()) {
errs.apellido_paterno = 'Requerido';
}

        if (!alumno.fecha_ingreso.trim())    errs.fecha_ingreso    = 'Requerido';
        if (!matricula.seccion_id)           errs.seccion_id       = 'Requerido';

        if (Object.keys(errs).length) {
 setErrors(errs);

 return; 
}

        setProcessing(true);

        try {
            let estudianteId = alumno.estu_id;
            const payload = buildAlumnoPayload();

            // Usamos FormData si hay una foto o siempre para ser consistentes con archivos
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (key === 'foto' && value instanceof File) {
                        formData.append(key, value);
                    } else if (key !== 'foto') {
                        formData.append(key, String(value));
                    }
                }
            });

            if (estudianteId) {
                formData.append('_method', 'PUT');
                await api.post(`/estudiantes/${estudianteId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                const res = await api.post('/estudiantes', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                estudianteId = res.data.data?.estu_id ?? res.data.estu_id;
                // Guardar el id creado para que si falla la matrícula, al reintentar actualice en vez de duplicar
                setAlumno(prev => ({ ...prev, estu_id: estudianteId as number }));
            }

            if (editingMatricula) {
                if (onEditSave) await onEditSave();
            } else {
                await onSave({ ...matricula, estu_id: String(estudianteId) });
            }

            await Promise.allSettled(
                [
                    { tipo: 'padre',     data: padre },
                    { tipo: 'madre',     data: madre },
                    { tipo: 'apoderado', data: apoderado },
                ]
                .filter(c => c.data.nombres.trim() || c.data.apellidos.trim())
                .map(c => api.post(`/estudiantes/${estudianteId}/contactos`, {
                    parentesco:     c.tipo,
                    nombres:        c.data.nombres,
                    apellidos:      c.data.apellidos,
                    email_contacto: c.data.email_contacto,
                    tipo_doc:       c.data.tipo_doc,
                    numero_doc:     c.data.numero_doc,
                    telefono_1:     c.data.telefono_1,
                    telefono_2:     c.data.telefono_2,
                    estado_civil:   c.data.estado_civil,
                    direccion:      c.data.direccion,
                    departamento:   c.data.departamento,
                    provincia:      c.data.provincia,
                    distrito:       c.data.distrito,
                    es_pagador:     c.data.es_pagador ? 'si' : 'no',
                    // Si es pagador, enviar la mensualidad para guardarla en estudiante_contacto
                    mensualidad:    c.data.es_pagador ? alumno.mensualidad : undefined,
                    dia_pago:       c.data.es_pagador ? alumno.dia_pago : undefined,
                }))
            );

            // ── Crear pagos inmediatos para conceptos únicos/anuales ──────────
            if (!editingMatricula && conceptosCobro.length > 0) {
                // Buscar el contacto pagador
                const pagador = [padre, madre, apoderado].find(c => c.es_pagador && (c.nombres.trim() || c.apellidos.trim()));
                if (pagador) {
                    // Obtener el id_contacto del pagador recién guardado
                    try {
                        const contactosRes = await api.get(`/estudiantes/${estudianteId}/contactos`);
                        const tiposPagador = ['padre', 'madre', 'apoderado'] as const;
                        let contactoId: number | null = null;
                        for (const tipo of tiposPagador) {
                            const c = tipo === 'padre' ? padre : tipo === 'madre' ? madre : apoderado;
                            if (c.es_pagador && (c.nombres.trim() || c.apellidos.trim())) {
                                contactoId = contactosRes.data[tipo]?.id_contacto ?? null;
                                break;
                            }
                        }

                        if (contactoId) {
                            // Solo conceptos únicos y anuales generan pago inmediato, y que estén incluidos
                            const conceptosInmediatos = conceptosCobro.filter(
                                c => (c.periodicidad === 'unico' || c.periodicidad === 'anual') && c.incluido,
                            );
                            if (conceptosInmediatos.length > 0) {
                                await api.post('/pagos/generar-pagos-matricula', {
                                    estu_id:     estudianteId,
                                    contacto_id: contactoId,
                                    grado_id:    selectedGrado,
                                    anio:        anio,
                                    conceptos:   conceptosInmediatos.map(c => ({
                                        concepto_id: c.concepto_id,
                                        nombre:      c.nombre,
                                        monto:       c.monto_final,
                                    })),
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Error al crear pagos de matrícula:', e);
                        // No bloquear el flujo si falla la creación de pagos
                    }
                }
            }

            onClose();
        } catch (e: any) {
            const flat: Record<string, string> = {};

            for (const [k, v] of Object.entries(e?.response?.data?.errors ?? {})) {
                flat[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
            }

            setErrors(flat);
        } finally {
            setProcessing(false);
        }
    };

    // ── JSX ────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-5 pb-3 border-b">
                    <DialogTitle className="text-lg font-bold">
                        {editingMatricula ? 'Editar Estudiante' : 'Matricular Estudiante'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <Tabs defaultValue="alumno" className="flex flex-col flex-1 overflow-hidden">
                        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 px-4">
                            <TabsTrigger value="alumno"    className={TAB_CLS}>Alumno</TabsTrigger>
                            <TabsTrigger value="padre"     className={TAB_CLS}>Padre</TabsTrigger>
                            <TabsTrigger value="madre"     className={TAB_CLS}>Madre</TabsTrigger>
                            <TabsTrigger value="apoderado" className={TAB_CLS}>Apoderado</TabsTrigger>
                        </TabsList>

                        <TabsContent value="alumno" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                            <AlumnoTab
                                alumno={alumno} setAlumno={setAlumno}
                                matricula={matricula} setM={setM}
                                grados={grados} secciones={secciones} nivelId={nivelId}
                                selectedGrado={selectedGrado} setSelectedGrado={setSelectedGrado}
                                dniSearch={dniSearch} setDniSearch={setDniSearch}
                                onDniSearch={handleDniSearch} searching={searching}
                                errors={errors}
                                onConceptosChange={setConceptosCobro}
                            />
                        </TabsContent>

                        {(['padre', 'madre', 'apoderado'] as const).map(tipo => {
                            const data = tipo === 'padre' ? padre : tipo === 'madre' ? madre : apoderado;

                            return (
                                <TabsContent key={tipo} value={tipo} className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                                    <ContactoTab
                                        tipo={tipo}
                                        data={data}
                                        onChange={(k, v) => setC(tipo, k, v)}
                                        onSearch={(dni: string) => handleContactoSearch(tipo, dni)}
                                        searching={searching}
                                    />
                                </TabsContent>
                            );
                        })}
                    </Tabs>

                    <DialogFooter className="px-6 py-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#00a65a] hover:bg-[#008d4c] text-white"
                        >
                            {processing ? 'Guardando…' : 'Guardar Matrícula'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
