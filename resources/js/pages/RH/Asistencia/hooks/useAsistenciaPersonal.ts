import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseAsistenciaPersonalParams {
    user_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
}

export function useAsistenciaPersonal(params: UseAsistenciaPersonalParams = {}) {
    const [asistencias, setAsistencias] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/rh/asistencia', { params });
            setAsistencias(response.data.data || []);
            setMeta(response.data.meta);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [JSON.stringify(params)]);

    return {
        asistencias,
        meta,
        isLoading,
        error,
        refetch: fetchData,
    };
}
