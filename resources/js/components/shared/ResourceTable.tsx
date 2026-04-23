import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export type Column<T> = {
    label:      string;
    className?: string;
    render:     (row: T, index: number) => React.ReactNode;
};

export type Paginated<T> = {
    data:         T[];
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
    from:         number;
    to:           number;
};

type Props<T> = {
    rows:           Paginated<T>;
    columns:        Column<T>[];
    getKey:         (row: T) => number | string;
    onEdit?:        (row: T) => void;
    onDelete?:      (row: T) => void;
    extraActions?:  (row: T) => React.ReactNode;
    onPageChange?:  (page: number) => void;
    onLoadMore?:    () => void;
    hasMore?:       boolean;
    loading?:       boolean;
};

export default function ResourceTable<T>({ 
    rows, columns, getKey, onEdit, onDelete, extraActions, onLoadMore, hasMore, loading 
}: Props<T>) {
    const showActions = !!(onEdit || onDelete || extraActions);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current || !onLoadMore || !hasMore || loading) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 100) {
                onLoadMore();
            }
        };

        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', handleScroll);
            return () => scrollElement.removeEventListener('scroll', handleScroll);
        }
    }, [onLoadMore, hasMore, loading]);

    return (
        <div>
            {/* View Desktop */}
            <div className="hidden md:block">
                <div ref={scrollRef} className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-lg border border-gray-100">
                    <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-[#00a65a] text-white text-center">
                            {columns.map((c, idx) => (
                                <th key={`col-${idx}`} className={`px-3 py-2 font-semibold first:rounded-tl-lg last:rounded-tr-lg border-b border-green-600 whitespace-nowrap ${c.className ?? ''}`}>{c.label}</th>
                            ))}
                            {showActions && <th className="px-3 py-2 font-semibold last:rounded-tr-lg border-b border-green-600 whitespace-nowrap">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (showActions ? 1 : 0)} className="py-8 text-center text-gray-400">
                                    No se encontraron registros.
                                </td>
                            </tr>
                        ) : rows.data.map((row, i) => (
                            <tr key={getKey(row)} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                                {columns.map((c, idx) => (
                                    <td key={`cell-${idx}`} className={`px-3 py-1.5 ${c.className ?? ''}`}>
                                        {c.render(row, i)}
                                    </td>
                                ))}
                                {showActions && (
                                    <td className="px-3 py-1.5">
                                        <div className="flex items-center justify-center gap-1">
                                            {onEdit && (
                                                <Button size="icon" variant="ghost" className="size-7 text-blue-600 hover:bg-blue-50" onClick={() => onEdit(row)}>
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button size="icon" variant="ghost" className="size-7 text-red-500 hover:bg-red-50" onClick={() => onDelete(row)}>
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            )}
                                            {extraActions?.(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {loading && (
                            <tr>
                                <td colSpan={columns.length + (showActions ? 1 : 0)} className="py-4 text-center text-sm text-gray-400">
                                    Cargando más...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
                <div className="mt-3 text-center text-sm text-gray-500">
                    Mostrando {rows.data.length} de {rows.total} registros
                </div>
            </div>

            {/* View Mobile (Tarjetas) */}
            <div className="md:hidden flex flex-col gap-3">
                {rows.data.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 border border-gray-100 rounded-lg">
                        No se encontraron registros.
                    </div>
                ) : rows.data.map((row, i) => (
                    <div key={getKey(row)} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        {columns.map((c, idx) => (
                            <div key={`cell-mob-${idx}`} className={`flex items-center justify-between gap-4 text-sm ${c.className ?? ''}`}>
                                <span className="font-semibold text-gray-400">{c.label}</span>
                                <div className="text-right font-medium text-gray-800 break-words max-w-[60%]">{c.render(row, i)}</div>
                            </div>
                        ))}
                        {showActions && (
                            <div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-50 pt-3">
                                {onEdit && (
                                    <Button size="sm" variant="ghost" className="h-8 gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={() => onEdit(row)}>
                                        <Pencil className="size-3.5" /> Editar
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button size="sm" variant="ghost" className="h-8 gap-2 bg-red-50 text-red-600 hover:bg-red-100" onClick={() => onDelete(row)}>
                                        <Trash2 className="size-3.5" /> Borrar
                                    </Button>
                                )}
                                {extraActions?.(row)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {loading && (
                <div className="md:hidden py-4 text-center text-sm text-gray-400">
                    Cargando más...
                </div>
            )}
            <div className="md:hidden mt-3 text-center text-sm text-gray-500">
                Mostrando {rows.data.length} de {rows.total} registros
            </div>
        </div>
    );
}
