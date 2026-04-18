import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useOptions } from '@/hooks/useOptions';
import type { Matricula, MatriculaApertura, EstudianteDisponible, SeccionOption, GradoOption, MatriculaFormData } from './useMatricula';
import type { Estudiante, EstudianteFormData } from '../../GestionAlumnos/hooks/useEstudiantes';

export function useNivelEstudiantes(aperturaId: number, nivelId: number) {
    const secciones = useOptions<SeccionOption>('/secciones');
    const grados    = useOptions<GradoOption>('/grados');

    const [apertura, setApertura]       = useState<MatriculaApertura | null>(null);
    const [nivelNombre, setNivelNombre] = useState('');
    const [matriculas, setMatriculas]   = useState<Matricula[]>([]);
    const [disponibles, setDisponibles] = useState<EstudianteDisponible[]>([]);
    const [loading, setLoading]         = useState(false);
    const [toggling, setToggling]       = useState<number | null>(null);
    const [search, setSearch]           = useState('');
    const [gradoFiltro, setGradoFiltro]     = useState<number | ''>('');
    const [seccionFiltro, setSeccionFiltro] = useState<number | ''>('');

    // Modal states
    const [modalOpen, setModalOpen]         = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(null);
    const [deletingId, setDeletingId]       = useState<number | null>(null);
    const [historialOpen, setHistorialOpen] = useState(false);
    const [historialUserId, setHistorialUserId] = useState<number | null>(null);
    const [historialNombre, setHistorialNombre] = useState('');
    const [resetOpen, setResetOpen]         = useState(false);
    const [resetUserId, setResetUserId]     = useState<number | null>(null);
    const [resetNombre, setResetNombre]     = useState('');
    const [editEstOpen, setEditEstOpen]     = useState(false);
    const [editEstudiante, setEditEstudiante] = useState<Estudiante | null>(null);
    const [editEstApiErrors, setEditEstApiErrors] = useState<Record<string, string[]>>({});
    const [fotoOpen, setFotoOpen]           = useState(false);
    const [selectedMatricula, setSelectedMatricula] = useState<Matricula | null>(null);

    const cargar = useCallback(async () => {
        setLoading(true);
        try {
            const [matRes, dispRes, aperRes, nivelRes] = await Promise.all([
                api.get(`/matriculas/aperturas/${aperturaId}/estudiantes`, { params: { per_page: 500, nivel_id: nivelId } }),
                api.get(`/matriculas/aperturas/${aperturaId}/disponibles`),
                api.get(`/matriculas/aperturas/${aperturaId}`),
                api.get(`/niveles/${nivelId}`),
            ]);
            setMatriculas(matRes.data.data ?? []);
            setDisponibles(dispRes.data ?? []);
            setApertura(aperRes.data.data ?? aperRes.data);
            setNivelNombre(nivelRes.data.data?.nombre_nivel ?? nivelRes.data?.nombre_nivel ?? '');
        } finally {
            setLoading(false);
        }
    }, [aperturaId, nivelId]);

    useEffect(() => { cargar(); }, [cargar]);

    const filteredMatriculas = (() => {
        let result = matriculas;

        // Filtro por grado
        if (gradoFiltro !== '') {
            result = result.filter(m => m.seccion?.grado?.grado_id === gradoFiltro);
        }

        // Filtro por sección (dependiente del grado seleccionado)
        if (seccionFiltro !== '') {
            result = result.filter(m => m.seccion_id === seccionFiltro);
        }

        // Filtro por búsqueda de texto
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(m => {
                const s = m.estudiante;
                return (
                    s?.primer_nombre?.toLowerCase().includes(q) ||
                    s?.segundo_nombre?.toLowerCase().includes(q) ||
                    s?.apellido_paterno?.toLowerCase().includes(q) ||
                    s?.apellido_materno?.toLowerCase().includes(q) ||
                    s?.doc_numero?.toLowerCase().includes(q) ||
                    m.seccion?.grado?.nombre_grado?.toLowerCase().includes(q) ||
                    m.seccion?.nombre?.toLowerCase().includes(q)
                );
            });
        }

        return result;
    })();

    // Grados únicos presentes en las matrículas cargadas
    const gradosDisponibles = Array.from(
        new Map(
            matriculas
                .filter(m => m.seccion?.grado)
                .map(m => [m.seccion!.grado!.grado_id, m.seccion!.grado!])
        ).values()
    ).sort((a, b) => a.nombre_grado.localeCompare(b.nombre_grado));

    // Secciones filtradas según el grado seleccionado (o todas si no hay grado)
    const seccionesDisponibles = Array.from(
        new Map(
            matriculas
                .filter(m => m.seccion && m.seccion_id != null && (gradoFiltro === '' || m.seccion.grado?.grado_id === gradoFiltro))
                .map(m => [m.seccion_id!, {
                    seccion_id: m.seccion_id as number,
                    nombre: m.seccion!.nombre,
                    label: gradoFiltro !== ''
                        ? m.seccion!.nombre
                        : `${m.seccion!.grado?.nombre_grado ?? ''} - ${m.seccion!.nombre}`,
                }])
        ).values()
    ).sort((a, b) => a.label.localeCompare(b.label));

    const handleMatricular = async (data: MatriculaFormData) => {
        await api.post('/matriculas', data);
        await cargar();
    };

    const handleAnular = async () => {
        if (!deletingId) return;
        setLoading(true);
        try {
            await api.delete(`/matriculas/${deletingId}`);
            setDeletingId(null);
            await cargar();
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBloqueo = async (m: Matricula) => {
        if (!m.estudiante?.user_id) return;
        setToggling(m.matricula_id);
        try {
            await api.patch(`/usuarios/${m.estudiante.user_id}/estado`);
            setMatriculas(prev => prev.map(item =>
                item.matricula_id === m.matricula_id && item.estudiante
                    ? { ...item, estudiante: { ...item.estudiante, estado_user: item.estudiante.estado_user === '5' ? '1' : '5' } }
                    : item
            ));
        } finally {
            setToggling(null);
        }
    };

    const openHistorial = (m: Matricula) => {
        if (!m.estudiante?.user_id) return;
        setHistorialUserId(m.estudiante.user_id);
        setHistorialNombre([m.estudiante.primer_nombre, m.estudiante.apellido_paterno].filter(Boolean).join(' '));
        setHistorialOpen(true);
    };

    const openEditEst = async (m: Matricula) => {
        if (!m.estudiante?.estu_id) return;
        const res = await api.get(`/estudiantes/${m.estudiante.estu_id}`);
        const full = res.data.data ?? res.data;
        setEditingMatricula({
            ...m,
            estudiante: {
                ...m.estudiante,
                primer_nombre:        full.perfil?.primer_nombre        ?? m.estudiante.primer_nombre,
                segundo_nombre:       full.perfil?.segundo_nombre        ?? m.estudiante.segundo_nombre,
                apellido_paterno:     full.perfil?.apellido_paterno      ?? m.estudiante.apellido_paterno,
                apellido_materno:     full.perfil?.apellido_materno      ?? m.estudiante.apellido_materno,
                genero:               full.perfil?.genero                ?? m.estudiante.genero,
                doc_numero:           full.perfil?.doc_numero            ?? m.estudiante.doc_numero,
                fecha_nacimiento:     full.perfil?.fecha_nacimiento      ?? '',
                telefono:             full.perfil?.telefono              ?? '',
                direccion:            full.perfil?.direccion             ?? '',
                email:                full.user?.email                   ?? '',
                // datos del estudiante
                edad:                 full.edad?.toString()            ?? '',
                talla:                full.talla                       ?? '',
                peso:                 full.peso                        ?? '',
                colegio:              full.colegio                     ?? '',
                neurodivergencia:     full.neurodivergencia            ?? '',
                terapia_ocupacional:  full.terapia_ocupacional         ?? '',
                seguro:               full.seguro                      ?? '',
                seguro_privado:       full.privado                     ?? '',
                mensualidad:          full.mensualidad?.toString()     ?? '',
                fecha_ingreso:        full.fecha_ingreso               ?? '',
                fecha_pago:           full.fecha_promovido             ?? '',
            },
        });
        setEditModalOpen(true);
    };

    const handleSaveEstudiante = async (data: EstudianteFormData) => {
        if (!editEstudiante) return;
        try {
            await api.put(`/estudiantes/${editEstudiante.estu_id}`, data);
            setEditEstOpen(false);
            setEditEstudiante(null);
            await cargar();
        } catch (e: any) {
            setEditEstApiErrors(e?.response?.data?.errors ?? {});
        }
    };

    const openReset = (m: Matricula) => {
        if (!m.estudiante?.user_id) return;
        setResetUserId(m.estudiante.user_id);
        setResetNombre([m.estudiante.primer_nombre, m.estudiante.apellido_paterno].filter(Boolean).join(' '));
        setResetOpen(true);
    };

    const openFotocheck = (m: Matricula) => {
        if (!m.estu_id) return;
        setSelectedMatricula(m);
        setFotoOpen(true);
    };

    const deletingMatricula = matriculas.find(m => m.matricula_id === deletingId);
    const studentName = deletingMatricula?.estudiante
        ? `${deletingMatricula.estudiante.primer_nombre} ${deletingMatricula.estudiante.apellido_paterno}`
        : 'este alumno';

    return {
        // data
        apertura, nivelNombre, matriculas, filteredMatriculas, disponibles, loading, toggling,
        secciones, grados, search, setSearch, studentName,
        gradoFiltro, setGradoFiltro: (v: number | '') => { setGradoFiltro(v); setSeccionFiltro(''); },
        seccionFiltro, setSeccionFiltro,
        gradosDisponibles, seccionesDisponibles,
        // modal states
        modalOpen, setModalOpen,
        editModalOpen, setEditModalOpen, editingMatricula,
        deletingId, setDeletingId,
        historialOpen, setHistorialOpen, historialUserId, historialNombre,
        resetOpen, setResetOpen, resetUserId, resetNombre,
        editEstOpen, setEditEstOpen, editEstudiante, editEstApiErrors,
        fotoOpen, setFotoOpen, selectedMatricula,
        // handlers
        cargar, handleMatricular, handleAnular, handleToggleBloqueo,
        openHistorial, openEditEst, handleSaveEstudiante, openReset, openFotocheck,
    };
}
