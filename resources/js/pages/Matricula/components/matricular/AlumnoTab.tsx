import { Search, Tag, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReqLabel, OptLabel, SELECT_CLS } from '@/components/shared/FormLabels';
import TitleForm from '@/components/TitleForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import api from '@/lib/api';
import type { GradoOption, SeccionOption, MatriculaFormData } from '../../hooks/useMatricula';
import type { AlumnoForm } from './types';

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Descuento = {
    descuento_id: number;
    motivo: string;
    tipo: 'porcentaje' | 'monto_fijo';
    valor: number;
    fecha_fin: string | null;
    concepto_id: number | null;
};

export type ConceptoCobro = {
    concepto_id:     number;
    nombre:          string;
    periodicidad:    'mensual' | 'anual' | 'unico';
    opcional:        boolean;
    incluido:        boolean;
    monto_base:      number;
    monto_final:     number;
    dia_vencimiento: number | null;
    editable:        boolean;
};

const MOTIVO_LABEL: Record<string, string> = {
    hermanos: 'Hermanos', merito: 'Mérito', beca: 'Beca', otro: 'Otro',
};

const PERIOD_BADGE: Record<string, string> = {
    mensual: 'bg-blue-100 text-blue-700',
    anual:   'bg-purple-100 text-purple-700',
    unico:   'bg-gray-100 text-gray-700',
};
const PERIOD_LABEL: Record<string, string> = {
    mensual: 'Mensual',
    anual:   'Anual',
    unico:   'Único',
};

// ── Props ──────────────────────────────────────────────────────────────────────

type Props = {
    alumno:           AlumnoForm;
    setAlumno:        React.Dispatch<React.SetStateAction<AlumnoForm>>;
    matricula:        MatriculaFormData;
    setM:             (k: keyof MatriculaFormData, v: string) => void;
    grados:           GradoOption[];
    secciones:        SeccionOption[];
    nivelId?:         number | null;
    selectedGrado:    string;
    setSelectedGrado: React.Dispatch<React.SetStateAction<string>>;
    dniSearch:        string;
    setDniSearch:     React.Dispatch<React.SetStateAction<string>>;
    onDniSearch:      () => void;
    searching:        boolean;
    errors:           Record<string, string>;
    // Exponer conceptos al modal padre para crear pagos al guardar
    onConceptosChange?: (conceptos: ConceptoCobro[]) => void;
};

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AlumnoTab({
    alumno, setAlumno, matricula, setM,
    grados, secciones, nivelId,
    selectedGrado, setSelectedGrado,
    dniSearch, setDniSearch, onDniSearch, searching,
    errors, onConceptosChange,
}: Props) {
    const setA = (k: keyof AlumnoForm, v: string) =>
        setAlumno(prev => ({ ...prev, [k]: v }));

    const err = (k: string) => errors[k]
        ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p>
        : null;

    const [conceptos, setConceptos]       = useState<ConceptoCobro[]>([]);
    const [descuentos, setDescuentos]     = useState<Descuento[]>([]);
    const [loadingTarifas, setLoadingTarifas] = useState(false);

    // ── Al cambiar grado → cargar TODOS los conceptos con tarifa ──────────
    useEffect(() => {
        if (!selectedGrado) { setConceptos([]); onConceptosChange?.([]); return; }
        setLoadingTarifas(true);
        const anio = new Date().getFullYear();

        api.get('/tarifas-pago')
            .then(res => {
                const tarifas: any[] = res.data;
                const activas = tarifas.filter(t =>
                    t.activo && Number(t.anio_escolar) === anio,
                );

                // Para cada tarifa activa, tomar la más específica (grado > general)
                const porConcepto = new Map<number, any>();
                for (const t of activas) {
                    const cid = t.concepto_id;
                    const prev = porConcepto.get(cid);
                    // Prioridad: grado específico > general (grado_id null)
                    if (!prev) {
                        porConcepto.set(cid, t);
                    } else if (String(t.grado_id) === String(selectedGrado)) {
                        porConcepto.set(cid, t); // reemplazar con la específica del grado
                    }
                }

                const lista: ConceptoCobro[] = Array.from(porConcepto.values()).map(t => ({
                    concepto_id:     t.concepto_id,
                    nombre:          t.concepto?.nombre ?? `Concepto #${t.concepto_id}`,
                    periodicidad:    t.concepto?.periodicidad ?? 'unico',
                    opcional:        t.concepto?.opcional ?? false,
                    incluido:        true,
                    monto_base:      Number(t.monto),
                    monto_final:     Number(t.monto),
                    dia_vencimiento: t.dia_vencimiento ?? null,
                    editable:        true,
                }));

                setConceptos(lista);
                onConceptosChange?.(lista);

                // Sincronizar mensualidad y dia_pago del alumno desde la tarifa mensual
                const mensual = lista.find(c => c.periodicidad === 'mensual');
                if (mensual) {
                    setAlumno(prev => ({
                        ...prev,
                        mensualidad: mensual.monto_final.toFixed(2),
                        dia_pago:    mensual.dia_vencimiento ?? prev.dia_pago,
                    }));
                }
            })
            .catch(() => { setConceptos([]); onConceptosChange?.([]); })
            .finally(() => setLoadingTarifas(false));
    }, [selectedGrado]);

    // ── Al encontrar alumno existente → cargar descuentos activos ─────────
    useEffect(() => {
        if (!alumno.estu_id) { setDescuentos([]); return; }
        api.get('/descuentos', { params: { estu_id: alumno.estu_id } })
            .then(res => {
                const activos = (res.data as Descuento[]).filter((d: any) => d.activo);
                setDescuentos(activos);
            })
            .catch(() => setDescuentos([]));
    }, [alumno.estu_id]);

    // ── Aplicar descuentos a los conceptos cuando cambian ─────────────────
    useEffect(() => {
        if (conceptos.length === 0) return;

        const actualizados = conceptos.map(c => {
            // Descuentos que aplican a este concepto (general o específico)
            const desc = descuentos.filter(d =>
                d.concepto_id === null || d.concepto_id === c.concepto_id,
            );
            let monto = c.monto_base;
            for (const d of desc) {
                if (d.tipo === 'porcentaje') monto -= monto * (d.valor / 100);
                else monto -= d.valor;
            }
            return { ...c, monto_final: Math.max(0, monto) };
        });
        setConceptos(actualizados);
        onConceptosChange?.(actualizados);

        // Sincronizar mensualidad del alumno
        const mensual = actualizados.find(c => c.periodicidad === 'mensual');
        if (mensual) {
            setAlumno(prev => ({ ...prev, mensualidad: mensual.monto_final.toFixed(2) }));
        }
    }, [descuentos]);

    // ── Toggle incluir/excluir concepto opcional ──────────────────────────
    const toggleIncluido = (concepto_id: number) => {
        const actualizados = conceptos.map(c =>
            c.concepto_id === concepto_id && c.opcional
                ? { ...c, incluido: !c.incluido }
                : c,
        );
        setConceptos(actualizados);
        onConceptosChange?.(actualizados);
    };

    return (
        <div className="space-y-5">
            <TitleForm className="border-b border-neutral-100 mb-4">
                Datos del Alumno
            </TitleForm>

            {/* ── DNI Buscador ──────────────────────────────────────── */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <Label className="text-xs font-bold text-emerald-800 mb-2 block">
                    Buscar Alumno Existente por DNI (Opcional)
                </Label>
                <div className="flex gap-2 max-w-xs">
                    <Input
                        className="h-10 text-sm bg-white"
                        placeholder="Ingresar DNI..."
                        value={dniSearch}
                        onChange={e => setDniSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onDniSearch())}
                    />
                    <Button
                        type="button" size="sm" onClick={onDniSearch} disabled={searching}
                        className="bg-[#00a65a] hover:bg-[#008d4c] text-white h-10 px-4"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
                {alumno.estu_id && (
                    <p className="text-[11px] text-emerald-600 mt-2 font-bold uppercase">
                        ✓ Alumno encontrado — datos cargados para editar
                    </p>
                )}
                {!alumno.estu_id && alumno.username && (
                    <p className="text-[11px] text-amber-600 mt-2 font-bold uppercase">
                        ℹ Alumno no encontrado — complete los campos para registrar uno nuevo
                    </p>
                )}
            </div>

            {/* ── Campos ───────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-5">

                {/* Asignación académica */}
                <div className="space-y-1.5">
                    <ReqLabel>Grupo Académico</ReqLabel>
                    <select
                        value={selectedGrado}
                        onChange={e => { setSelectedGrado(e.target.value); setM('seccion_id', ''); }}
                        className={SELECT_CLS}
                    >
                        <option value="">Seleccionar…</option>
                        {grados.filter(g => !nivelId || Number(g.nivel_id) === Number(nivelId)).map(g => (
                            <option key={g.grado_id} value={g.grado_id.toString()}>
                                {g.nombre_grado}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <ReqLabel>Sección / Aula</ReqLabel>
                    <select
                        value={matricula.seccion_id}
                        onChange={e => setM('seccion_id', e.target.value)}
                        className={SELECT_CLS}
                        disabled={!selectedGrado}
                    >
                        <option value="">
                            {!selectedGrado
                                ? 'Primero selecciona un grado'
                                : secciones.filter(s => String(s.id_grado) === String(selectedGrado)).length === 0
                                    ? 'Sin secciones para este grado'
                                    : 'Seleccionar…'}
                        </option>
                        {secciones.filter(s => String(s.id_grado) === String(selectedGrado)).map(s => (
                            <option key={s.seccion_id} value={s.seccion_id.toString()}>
                                {s.nombre}
                            </option>
                        ))}
                    </select>
                    {err('seccion_id')}
                </div>
                <div className="col-span-1" />

                {/* Datos personales */}
                <div className="space-y-1.5">
                    <ReqLabel>Nro. DNI</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.username} onChange={e => setA('username', e.target.value)} placeholder="DNI..." />
                    {err('username')}
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Email</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" type="email" value={alumno.email} onChange={e => setA('email', e.target.value)} placeholder="correo@..." />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Género</OptLabel>
                    <select value={alumno.genero} onChange={e => setA('genero', e.target.value)} className={SELECT_CLS}>
                        <option value="">Seleccionar…</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <ReqLabel>Primer Nombre</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.primer_nombre} onChange={e => setA('primer_nombre', e.target.value)} placeholder="Nombre..." />
                    {err('primer_nombre')}
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Segundo Nombre</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.segundo_nombre} onChange={e => setA('segundo_nombre', e.target.value)} placeholder="Segundo nombre..." />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Fecha Nacimiento</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" type="date" value={alumno.fecha_nacimiento} onChange={e => setA('fecha_nacimiento', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                    <ReqLabel>Apellido Paterno</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.apellido_paterno} onChange={e => setA('apellido_paterno', e.target.value)} placeholder="Ap. paterno..." />
                    {err('apellido_paterno')}
                </div>
                <div className="space-y-1.5">
                    <ReqLabel>Apellido Materno</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.apellido_materno} onChange={e => setA('apellido_materno', e.target.value)} placeholder="Ap. materno..." />
                    {err('apellido_materno')}
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Edad</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" type="number" value={alumno.edad} onChange={e => setA('edad', e.target.value)} placeholder="0" />
                </div>

                <div className="space-y-1.5">
                    <OptLabel>Talla</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.talla} onChange={e => setA('talla', e.target.value)} placeholder="1.50m" />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Peso</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.peso} onChange={e => setA('peso', e.target.value)} placeholder="50kg" />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Teléfono</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.telefono} onChange={e => setA('telefono', e.target.value)} placeholder="999 999 999" />
                </div>

                <div className="col-span-2 space-y-1.5">
                    <OptLabel>Dirección</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.direccion} onChange={e => setA('direccion', e.target.value)} placeholder="Av. ..." />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Colegio de Procedencia</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.colegio} onChange={e => setA('colegio', e.target.value)} placeholder="I.E. ..." />
                </div>

                <div className="space-y-1.5">
                    <OptLabel>Sufre algún tipo de enfermedad</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.neurodivergencia} onChange={e => setA('neurodivergencia', e.target.value)} placeholder="Especificar..." />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Realiza todo tipo de esfuerzo físico</OptLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" value={alumno.terapia_ocupacional} onChange={e => setA('terapia_ocupacional', e.target.value)} placeholder="Especificar..." />
                </div>
                <div className="space-y-1.5">
                    <OptLabel>Seguro</OptLabel>
                    <select value={alumno.seguro} onChange={e => setA('seguro', e.target.value)} className={SELECT_CLS}>
                        <option value="">Seleccionar…</option>
                        <option value="Essalud">Essalud</option>
                        <option value="SIS">SIS</option>
                        <option value="Privado">Privado</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5 font-semibold text-neutral-700">
                        Opcional (Solo si es privado)
                    </Label>
                    <Input
                        className="h-10 text-sm rounded-xl bg-neutral-50/50"
                        value={alumno.seguro_privado}
                        onChange={e => setA('seguro_privado', e.target.value)}
                        placeholder="Aseguradora..."
                        disabled={alumno.seguro !== 'Privado'}
                    />
                </div>
                <div className="col-span-2" />

                <div className="space-y-1.5">
                    <ReqLabel>Fecha de Ingreso</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" type="date" value={alumno.fecha_ingreso} onChange={e => setA('fecha_ingreso', e.target.value)} />
                    {err('fecha_ingreso')}
                </div>
                <div className="col-span-2" />
            </div>

            {/* ── Conceptos de Cobro ────────────────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                    <TitleForm className="mb-0">
                        Conceptos de Cobro
                    </TitleForm>
                    {loadingTarifas && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 animate-pulse">
                            <RefreshCw className="size-3 animate-spin" /> Cargando tarifas…
                        </span>
                    )}
                </div>

                {!selectedGrado && (
                    <p className="text-xs text-gray-400 italic py-2">
                        Selecciona un grado para ver los conceptos de cobro configurados.
                    </p>
                )}

                {selectedGrado && !loadingTarifas && conceptos.length === 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
                        Sin tarifas configuradas para este grado. Ve a <strong>Config. Cobros → Tarifas por Grado</strong> para configurarlas.
                    </div>
                )}

                {conceptos.length > 0 && (
                    <>
                        {/* Descuentos activos del alumno */}
                        {descuentos.length > 0 && (
                            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 space-y-1.5">
                                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                                    <Tag className="size-3" /> Descuentos activos del alumno
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {descuentos.map(d => (
                                        <div key={d.descuento_id} className="flex items-center gap-1.5 rounded-lg bg-white border border-indigo-100 px-2.5 py-1.5 text-xs">
                                            <TrendingDown className="size-3 text-indigo-500" />
                                            <span className="font-bold text-indigo-700">{MOTIVO_LABEL[d.motivo] ?? d.motivo}</span>
                                            <span className="text-gray-500">
                                                {d.tipo === 'porcentaje' ? `-${d.valor}%` : `-S/ ${Number(d.valor).toFixed(2)}`}
                                            </span>
                                            {d.concepto_id && <span className="text-gray-400 text-[10px]">(concepto específico)</span>}
                                            {d.fecha_fin && <span className="text-gray-400 text-[10px]">hasta {d.fecha_fin}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lista de conceptos */}
                        <ResourceTable
                            rows={{ data: conceptos, current_page: 1, last_page: 1, per_page: conceptos.length, total: conceptos.length, from: 1, to: conceptos.length }}
                            columns={[
                                {
                                    label: '',
                                    render: c => c.opcional ? (
                                        <input
                                            type="checkbox"
                                            checked={c.incluido}
                                            onChange={() => toggleIncluido(c.concepto_id)}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            title="Desmarcar para excluir este cobro"
                                        />
                                    ) : (
                                        <span className="text-gray-300 text-xs" title="Obligatorio">—</span>
                                    ),
                                },
                                {
                                    label: 'Concepto',
                                    render: c => (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="size-3.5 text-gray-400 shrink-0" />
                                            <span className={`font-semibold text-xs ${!c.incluido ? 'opacity-40' : ''}`}>{c.nombre}</span>
                                            {c.opcional && (
                                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-px rounded font-semibold">opcional</span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    label: 'Tipo',
                                    render: c => (
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${PERIOD_BADGE[c.periodicidad]} ${!c.incluido ? 'opacity-40' : ''}`}>
                                            {PERIOD_LABEL[c.periodicidad]}
                                        </span>
                                    ),
                                },
                                {
                                    label: 'Tarifa base',
                                    render: c => (
                                        <span className={`text-xs text-gray-500 ${!c.incluido ? 'opacity-40' : ''}`}>
                                            S/ {c.monto_base.toFixed(2)}
                                        </span>
                                    ),
                                },
                                {
                                    label: 'Monto a cobrar',
                                    render: c => (
                                        <span className={`text-xs font-bold text-gray-800 ${!c.incluido ? 'opacity-40' : ''}`}>
                                            S/ {c.monto_final.toFixed(2)}
                                        </span>
                                    ),
                                },
                            ] as Column<ConceptoCobro>[]}
                            getKey={c => c.concepto_id}
                        />

                        {/* Total */}
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
                            <span className="text-xs font-black text-gray-700 uppercase tracking-wide">Total a cobrar al matricular</span>
                            <span className="font-black text-emerald-700 text-sm">
                                S/ {conceptos.filter(c => c.incluido).reduce((s, c) => s + c.monto_final, 0).toFixed(2)}
                            </span>
                        </div>

                        <p className="text-[10px] text-gray-400">
                            Los conceptos <strong>Mensual</strong> se generan automáticamente cada mes. Los conceptos <strong>Único</strong> y <strong>Anual</strong> se registran como pago pendiente al guardar la matrícula.
                        </p>
                    </>
                )}

                {err('mensualidad')}
            </div>

            {/* Foto */}
            <div className="space-y-1.5 pb-4">
                <TitleForm className="border-b border-neutral-100 mb-4 mt-2">
                    Foto del Alumno
                </TitleForm>
                <Label className="text-xs font-semibold text-neutral-700">
                    Formatos permitidos: JPG, PNG, GIF (max. 2MB)
                </Label>
                <Input
                    className="h-12 w-full text-sm rounded-xl bg-neutral-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={e => setAlumno(prev => ({ ...prev, foto: e.target.files ? e.target.files[0] : null }))}
                />
            </div>
        </div>
    );
}
