import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export type Usuario = {
    estu_id?: number;
    docente_id?: number;
    perfil?: {
        doc_numero: string;
        apellido_paterno: string;
        apellido_materno: string;
        primer_nombre: string;
    };
};

export type HistorialAsistencia = {
    asistencia_id: number;
    fecha: string;
    turno: 'M' | 'T' | 'N';
    hora_entrada?: string;
    hora_salida?: string;
    estado: '1' | '0' | 'T';
};

export function useAsistencia() {
    const [tipo, setTipo] = useState<'E' | 'D'>('E');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [page, setPage] = useState(1);
    const [allUsers, setAllUsers] = useState<Usuario[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Reset cuando cambia tipo, búsqueda o filtros
    useEffect(() => {
        setAllUsers([]);
        setPage(1);
        setHasMore(true);
    }, [tipo, search, filters]);

    // Cargar usuarios
    useEffect(() => {
        if (page === 1 || hasMore) {
            loadUsers();
        }
    }, [tipo, page, search, filters]);

    const loadUsers = async () => {
        if (loading) return;
        
        setLoading(true);

        try {
            const res = await api.get('/asistencia/usuarios', {
                params: { tipo, search, page, ...filters }
            });
            
            const newUsers = res.data.data || [];
            setTotalCount(res.data.total || 0);
            
            if (page === 1) {
                setAllUsers(newUsers);
            } else {
                setAllUsers(prev => [...prev, ...newUsers]);
            }
            
            // Verificar si hay más páginas
            setHasMore(res.data.current_page < res.data.last_page);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Detectar scroll en el contenedor
    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || loading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        
        // Si está cerca del final (100px antes), cargar más
        if (scrollHeight - scrollTop - clientHeight < 100) {
            setPage(prev => prev + 1);
        }
    };

    const changeTipo = (newTipo: 'E' | 'D') => {
        setTipo(newTipo);
        setFilters({}); // Reset filters when changing type
    };

    return {
        tipo,
        search,
        filters,
        allUsers,
        loading,
        hasMore,
        totalCount,
        scrollContainerRef,
        handleScroll,
        setSearch,
        setFilters,
        changeTipo,
    };
}

