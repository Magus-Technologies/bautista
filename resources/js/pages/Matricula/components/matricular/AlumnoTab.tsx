import { Search } from 'lucide-react';
import { ReqLabel, OptLabel, SELECT_CLS } from '@/components/shared/FormLabels';
import TitleForm from '@/components/TitleForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GradoOption, SeccionOption, MatriculaFormData } from '../../hooks/useMatricula';
import type { AlumnoForm } from './types';

type Props = {
    alumno:         AlumnoForm;
    setAlumno:      React.Dispatch<React.SetStateAction<AlumnoForm>>;
    matricula:      MatriculaFormData;
    setM:           (k: keyof MatriculaFormData, v: string) => void;
    grados:         GradoOption[];
    secciones:      SeccionOption[];
    nivelId?:       number | null;
    selectedGrado:  string;
    setSelectedGrado: React.Dispatch<React.SetStateAction<string>>;
    dniSearch:      string;
    setDniSearch:   React.Dispatch<React.SetStateAction<string>>;
    onDniSearch:    () => void;
    searching:      boolean;
    errors:         Record<string, string>;
};

export default function AlumnoTab({
    alumno, setAlumno, matricula, setM,
    grados, secciones, nivelId,
    selectedGrado, setSelectedGrado,
    dniSearch, setDniSearch, onDniSearch, searching,
    errors,
}: Props) {
    const setA = (k: keyof AlumnoForm, v: string) =>
        setAlumno(prev => ({ ...prev, [k]: v }));

    const err = (k: string) => errors[k]
        ? <p className="text-xs text-red-500 mt-0.5">{errors[k]}</p>
        : null;

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
                        onChange={e => {
 setSelectedGrado(e.target.value); setM('seccion_id', ''); 
}}
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
                <div className="space-y-1.5">
                    <ReqLabel>Mensualidad (S/)</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" type="number" step="0.01" value={alumno.mensualidad} onChange={e => setA('mensualidad', e.target.value)} placeholder="0.00" />
                    {err('mensualidad')}
                </div>
                <div className="space-y-1.5">
                    <ReqLabel>Fecha de Pago</ReqLabel>
                    <Input className="h-10 text-sm rounded-xl bg-neutral-50/50" type="date" value={alumno.fecha_pago} onChange={e => setA('fecha_pago', e.target.value)} />
                    {err('fecha_pago')}
                </div>

                {/* Foto */}
                <div className="col-span-3 space-y-1.5 pb-4">
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
        </div>
    );
}
