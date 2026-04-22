import { Search, Filter, Grid, List as ListIcon, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import CourseCard from './CourseCard';

const COURSE_COLORS = [
    '#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706', '#0891b2', '#4f46e5'
];

export default function StudentCursos() {
    const [cursos, setCursos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        api.get('/alumno/cursos')
            .then(res => setCursos(res.data))
            .finally(() => setLoading(false));
    }, []);

    const filteredCursos = cursos.filter(c => 
        c.curso?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        c.docente?.perfil?.primer_nombre?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Cargando tus cursos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Cabecera de Control - Estilo Blackboard (Igual que docente) */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button 
                        variant={viewMode === 'grid' ? 'default' : 'outline'} 
                        size="icon" 
                        onClick={() => setViewMode('grid')}
                        className="rounded-xl h-11 w-11"
                    >
                        <Grid size={18} />
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'default' : 'outline'} 
                        size="icon" 
                        onClick={() => setViewMode('list')}
                        className="rounded-xl h-11 w-11"
                    >
                        <ListIcon size={18} />
                    </Button>
                </div>

                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="Buscar en mis cursos..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 pl-12 rounded-2xl bg-gray-50 border-none font-bold focus-visible:ring-2 focus-visible:ring-emerald-600/20"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select className="h-11 px-4 rounded-xl bg-gray-50 border-none font-bold text-xs text-gray-600 focus:ring-2 focus:ring-emerald-600/20 outline-none cursor-pointer">
                        <option>Mis Cursos {new Date().getFullYear()}</option>
                        <option>Todos los periodos</option>
                    </select>
                    <Button variant="outline" className="h-11 rounded-xl border-gray-100 gap-2 font-bold text-xs uppercase tracking-widest">
                        <Filter size={16} /> Filtros
                    </Button>
                </div>
            </div>

            {/* Contador de resultados */}
            <div className="flex items-center gap-3 px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{filteredCursos.length} Materias activas</span>
                <div className="h-px flex-1 bg-gray-50" />
            </div>

            {/* Grid/List de Cursos para Alumnos */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'grid-cols-1'}`}>
                {filteredCursos.map((c, i) => (
                    viewMode === 'grid' ? (
                        <CourseCard 
                            key={c.id || c.docen_curso_id}
                            id={c.docen_curso_id?.toString() || c.id?.toString()}
                            courseCode={`COD-${c.curso_id}`}
                            title={c.curso?.nombre}
                            status="Activo"
                            color={c.settings?.color || COURSE_COLORS[i % COURSE_COLORS.length]}
                            href={`/alumno/cursos/${c.docen_curso_id}`}
                            role="student"
                            professor={`${c.docente?.perfil?.primer_nombre} ${c.docente?.perfil?.apellido_paterno}`}
                            professorPic={c.docente?.perfil?.foto_perfil ? `/storage/${c.docente.perfil.foto_perfil}` : undefined}
                            progress={65} // Hardcoded por ahora, luego integrar progreso real
                            term={`${new Date().getFullYear()}-I`}
                        />
                    ) : (
                        <Link 
                            key={c.id || c.docen_curso_id}
                            href={`/alumno/cursos/${c.docen_curso_id}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 transition-all gap-4 group"
                        >
                            <div className="flex items-center gap-5">
                                <div className="size-14 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-md" style={{ backgroundColor: COURSE_COLORS[i % COURSE_COLORS.length] }}>
                                    {c.curso?.nombre?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">
                                        <BookOpen size={12} />
                                        <span>COD-{c.curso_id} • {new Date().getFullYear()}-I</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {c.curso?.nombre}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500 mt-1">
                                        Prof: {c.docente?.perfil?.primer_nombre} {c.docente?.perfil?.apellido_paterno}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 self-start sm:self-auto w-full sm:w-auto">
                                <div className="hidden sm:block flex-1 min-w-[100px]">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">
                                        <span className="text-gray-400">Progreso</span>
                                        <span className="text-blue-600">65%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                                        <div className="h-full bg-blue-600" style={{ width: '65%' }} />
                                    </div>
                                </div>
                                <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </Link>
                    )
                ))}
            </div>

            {filteredCursos.length === 0 && (
                <div className="p-20 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 font-bold">No tienes cursos que coincidan con la búsqueda.</p>
                </div>
            )}
        </div>
    );
}
