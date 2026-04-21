import { useCallback, useEffect, useState } from 'react';
import type { Paginated } from '@/components/shared/ResourceTable';
import api from '@/lib/api';

type ApiErrors = Record<string, string[]>;

export type ResourceState<T> = {
    rows:       Paginated<T> | null;
    loading:    boolean;
    search:     string;
    page:       number;
    setSearch:  (v: string) => void;
    setPage:    (v: number) => void;
    reload:     () => void;
    create:     (data: unknown) => Promise<void>;
    update:     (id: number, data: unknown) => Promise<void>;
    remove:     (id: number) => Promise<void>;
    apiErrors:  ApiErrors;
    clearErrors:() => void;
    success:    string | null;
    clearSuccess:() => void;
    loadMore:   () => void;
    hasMore:    boolean;
};

export function useResource<T>(endpoint: string, initialParams: Record<string, any> = {}): ResourceState<T> {
    const [rows, setRows]         = useState<Paginated<T> | null>(null);
    const [loading, setLoading]   = useState(false);
    const [search, setSearch]     = useState('');
    const [page, setPage]         = useState(1);
    const [apiErrors, setErrors]  = useState<ApiErrors>({});
    const [success, setSuccess]   = useState<string | null>(null);

    const fetch = useCallback(async (appendData = false) => {
        setLoading(true);

        try {
            const { data } = await api.get(endpoint, { 
                params: { ...initialParams, search, page } 
            });
            
            if (appendData && rows) {
                setRows({
                    ...data,
                    data: [...rows.data, ...data.data]
                });
            } else {
                setRows(data);
            }
        } finally {
            setLoading(false);
        }
    }, [endpoint, search, page, JSON.stringify(initialParams)]);

    useEffect(() => {
        if (page === 1) {
            fetch(false);
        } else {
            fetch(true);
        }
    }, [fetch]);

    const create = async (payload: unknown) => {
        setErrors({});
        await api.post(endpoint, payload);
        setSuccess('Registro guardado correctamente.');
        setPage(1);
        await fetch(false);
    };

    const update = async (id: number, payload: unknown) => {
        setErrors({});
        // PHP/Laravel no parsea FormData en PUT; usar POST con _method spoofing
        if (payload instanceof FormData) {
            payload.append('_method', 'PUT');
            await api.post(`${endpoint}/${id}`, payload);
        } else {
            await api.put(`${endpoint}/${id}`, payload);
        }
        setSuccess('Registro actualizado correctamente.');
        setPage(1);
        await fetch(false);
    };

    const remove = async (id: number) => {
        await api.delete(`${endpoint}/${id}`);
        setSuccess('Registro eliminado correctamente.');
        setPage(1);
        await fetch(false);
    };

    // Capture 422 validation errors automatically
    const wrap = <A extends unknown[]>(fn: (...a: A) => Promise<void>) =>
        async (...args: A) => {
            try {
                await fn(...args);
            } catch (err: unknown) {
                const e = err as { response?: { status?: number; data?: { errors?: ApiErrors } } };

                if (e.response?.status === 422 && e.response.data?.errors) {
                    setErrors(e.response.data.errors);
                }

                throw err;
            }
        };

    const loadMore = useCallback(() => {
        if (rows && rows.current_page < rows.last_page && !loading) {
            setPage(prev => prev + 1);
        }
    }, [rows, loading]);

    const hasMore = rows ? rows.current_page < rows.last_page : false;

    return {
        rows, loading, search, page,
        setSearch: (v) => {
 setSearch(v); setPage(1); 
},
        setPage,
        reload: () => fetch(false),
        create:  wrap(create),
        update:  wrap(update),
        remove,
        apiErrors,
        clearErrors: () => setErrors({}),
        success,
        clearSuccess: () => setSuccess(null),
        loadMore,
        hasMore,
    };
}
