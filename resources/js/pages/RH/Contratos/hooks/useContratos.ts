import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseContratosParams {
    search?: string;
    estado?: string;
}

export function useContratos(params: UseContratosParams = {}) {
    const [contratos, setContratos] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/rh/contratos', { params });
            setContratos(response.data.data || []);
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
        contratos,
        meta,
        isLoading,
        error,
        refetch: fetchData,
    };
}
