import { Link } from '@inertiajs/react';
import { Star, MoreVertical, BookOpen, GraduationCap, User, Calendar, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CourseCardProps {
    id: string;
    title: string;
    courseCode: string;
    professor?: string;
    professorPic?: string;
    status: string;
    color: string;
    image?: string;
    href: string;
    role: 'student' | 'teacher';
    progress?: number;
    term?: string;
}

export default function CourseCard({ 
    id, 
    title, 
    courseCode, 
    professor, 
    professorPic,
    status, 
    color, 
    image, 
    href, 
    role,
    progress = 0,
    term = "2024-I"
}: CourseCardProps) {
    const [isStarred, setIsStarred] = useState(false);

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] hover:-translate-y-2 dark:border-gray-800 dark:bg-gray-900">
            {/* Cabecera Decortativa */}
            <div className="h-40 w-full relative overflow-hidden shrink-0" style={{ backgroundColor: color }}>
                {image ? (
                    <img src={image} alt={title} className="h-full w-full object-cover opacity-60 mix-blend-overlay transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/10 opacity-40" />
                )}
                
                {/* Overlay de Gradiente Inferior */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Badge de Estado Superior */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-2xl bg-white/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xl border border-white/10">
                        {status || 'Activo'}
                    </span>
                </div>

                {/* Acción de Favorito */}
                <button 
                    onClick={(e) => { e.preventDefault(); setIsStarred(!isStarred); }}
                    className="absolute top-6 right-6 p-2 rounded-2xl bg-white/20 backdrop-blur-xl text-white hover:bg-white/40 transition-all active:scale-95 border border-white/10"
                >
                    <Star size={18} fill={isStarred ? "white" : "none"} strokeWidth={2.5} />
                </button>
            </div>

            {/* Cuerpo del Contenido */}
            <div className="flex flex-1 flex-col p-8 -mt-8 relative z-10 bg-white rounded-t-[2.5rem] dark:bg-gray-900">
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">
                        <BookOpen size={12} />
                        <span>{courseCode} • {term}</span>
                    </div>
                    <Link href={href}>
                        <h3 className="text-2xl font-black leading-tight text-gray-900 transition-colors line-clamp-2 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400">
                            {title}
                        </h3>
                    </Link>
                </div>

                {/* Información del Docente / Entorno */}
                <div className="mt-8 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-14 items-center justify-center rounded-[1.25rem] bg-emerald-50 border-2 border-white shadow-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                            {professorPic ? (
                                <img src={professorPic} alt={professor} className="size-full object-cover" />
                            ) : (
                                <User size={24} className="text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{role === 'teacher' ? 'Docente (Tú)' : 'Docente'}</p>
                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                                {professor || 'Staff Educativo'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="hidden sm:flex flex-col items-end">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Modalidad</p>
                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">Presencial</p>
                    </div>
                </div>

                {/* Barra de Progreso para Alumnos */}
                {role === 'student' && (
                    <div className="space-y-3 mb-8 bg-gray-50 p-5 rounded-[1.5rem] dark:bg-gray-800/50">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
                            <span className="text-gray-400">Progreso de avance</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{progress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-gray-800">
                            <div 
                                className="h-full bg-emerald-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                )}

                {/* Acciones Finales */}
                <div className="mt-auto flex gap-4">
                    <Link href={href} className="w-full">
                        <Button className="w-full rounded-[1.25rem] bg-gray-900 h-14 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 hover:shadow-gray-300 active:scale-95 dark:shadow-none">
                            Entrar al curso
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
