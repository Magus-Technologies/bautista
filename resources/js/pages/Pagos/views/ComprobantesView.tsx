import { useState, useEffect } from 'react';
import { FileText, Download, CheckSquare, Square, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';

interface Comprobante {
    id: number;
    tipo_documento: string;
    serie: string;
    numero: string;
    fecha_emision: string;
    cliente_nombre: string;
    cliente_num_doc: string;
    total: number;
    estado: string;
    moneda: string;
}

export default function ComprobantesView() {
    const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
    const [filteredComprobantes, setFilteredComprobantes] = useState<Comprobante[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);
    const [downloading, setDownloading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<string>('todos');
    const [estadoFilter, setEstadoFilter] = useState<string>('todos');

    useEffect(() => {
        fetchComprobantes();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [comprobantes, searchTerm, tipoFilter, estadoFilter]);

    const fetchComprobantes = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/comprobantes');
            setComprobantes(data.data || []);
        } catch (error) {
            console.error('Error cargando comprobantes:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...comprobantes];

        // Filtro de búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                c.cliente_nombre.toLowerCase().includes(term) ||
                c.cliente_num_doc.includes(term) ||
                `${c.serie}-${c.numero}`.toLowerCase().includes(term)
            );
        }

        // Filtro por tipo
        if (tipoFilter !== 'todos') {
            filtered = filtered.filter(c => c.tipo_documento === tipoFilter);
        }

        // Filtro por estado
        if (estadoFilter !== 'todos') {
            filtered = filtered.filter(c => c.estado === estadoFilter);
        }

        setFilteredComprobantes(filtered);
    };

    const toggleSelect = (id: number) => {
        setSelected(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            // Máximo 2 seleccionados
            if (prev.length >= 2) {
                return [prev[1], id];
            }
            return [...prev, id];
        });
    };

    const handleDescargarDual = async () => {
        if (selected.length !== 2) {
            alert('Debes seleccionar exactamente 2 comprobantes');
            return;
        }

        try {
            setDownloading(true);
            const response = await axios.post('/api/comprobantes/pdf-dual', {
                comprobante_ids: selected
            }, {
                responseType: 'blob'
            });

            // Crear URL del blob y descargar
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `comprobantes-${selected[0]}-${selected[1]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setSelected([]);
        } catch (error) {
            console.error('Error descargando PDF dual:', error);
            alert('Error al generar el PDF');
        } finally {
            setDownloading(false);
        }
    };

    const getTipoLabel = (tipo: string) => {
        return tipo === 'boleta' ? 'Boleta' : 'Factura';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setTipoFilter('todos');
        setEstadoFilter('todos');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Cargando comprobantes...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con botón de descarga */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                    <FileText className="size-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Comprobantes Emitidos</h3>
                        <p className="text-sm text-gray-500">
                            {selected.length === 0 && 'Selecciona 2 comprobantes para descargar en formato A4 media hoja'}
                            {selected.length === 1 && 'Selecciona 1 comprobante más'}
                            {selected.length === 2 && '2 comprobantes seleccionados - Listo para descargar'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleDescargarDual}
                    disabled={selected.length !== 2 || downloading}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                    <Download className="size-4" />
                    {downloading ? 'Generando...' : 'Descargar PDF Dual'}
                </Button>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="size-4 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Filtros</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Buscador */}
                    <div className="md:col-span-2">
                        <Label htmlFor="search" className="text-xs text-gray-600 mb-1">Buscar</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                id="search"
                                type="text"
                                placeholder="Cliente, documento o número..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Filtro por Tipo */}
                    <div>
                        <Label htmlFor="tipo" className="text-xs text-gray-600 mb-1">Tipo</Label>
                        <select
                            id="tipo"
                            value={tipoFilter}
                            onChange={(e) => setTipoFilter(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="boleta">Boleta</option>
                            <option value="factura">Factura</option>
                        </select>
                    </div>

                    {/* Filtro por Estado */}
                    <div>
                        <Label htmlFor="estado" className="text-xs text-gray-600 mb-1">Estado</Label>
                        <select
                            id="estado"
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="aceptado">Aceptado</option>
                            <option value="generado">Generado</option>
                            <option value="rechazado">Rechazado</option>
                        </select>
                    </div>
                </div>

                {/* Botón limpiar filtros */}
                {(searchTerm || tipoFilter !== 'todos' || estadoFilter !== 'todos') && (
                    <div className="mt-3 flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="text-xs"
                        >
                            Limpiar filtros
                        </Button>
                    </div>
                )}

                {/* Contador de resultados */}
                <div className="mt-3 text-sm text-gray-600">
                    Mostrando <strong>{filteredComprobantes.length}</strong> de <strong>{comprobantes.length}</strong> comprobantes
                </div>
            </div>

            {/* Tabla de comprobantes */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#00a65a] text-white">
                            <tr>
                                <th className="px-4 py-3 text-center w-12">
                                    <CheckSquare className="size-4 mx-auto" />
                                </th>
                                <th className="px-4 py-3 text-left">Tipo</th>
                                <th className="px-4 py-3 text-left">Número</th>
                                <th className="px-4 py-3 text-left">Cliente</th>
                                <th className="px-4 py-3 text-left">Documento</th>
                                <th className="px-4 py-3 text-center">Fecha</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredComprobantes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-gray-400">
                                        {comprobantes.length === 0 
                                            ? 'No hay comprobantes emitidos'
                                            : 'No se encontraron comprobantes con los filtros aplicados'
                                        }
                                    </td>
                                </tr>
                            ) : (
                                filteredComprobantes.map((comp) => (
                                    <tr
                                        key={comp.id}
                                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                            selected.includes(comp.id) ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => toggleSelect(comp.id)}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            {selected.includes(comp.id) ? (
                                                <CheckSquare className="size-5 text-blue-600 mx-auto" />
                                            ) : (
                                                <Square className="size-5 text-gray-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="font-medium">
                                                {getTipoLabel(comp.tipo_documento)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                                            {comp.serie}-{comp.numero}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {comp.cliente_nombre}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-600">
                                            {comp.cliente_num_doc}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">
                                            {formatDate(comp.fecha_emision)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                                            S/ {Number(comp.total).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                className={`
                                                    ${comp.estado === 'aceptado' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                                    ${comp.estado === 'generado' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                                    ${comp.estado === 'rechazado' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                                    font-bold
                                                `}
                                                variant="outline"
                                            >
                                                {comp.estado.toUpperCase()}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <FileText className="size-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Formato A4 Media Hoja</p>
                        <p className="text-blue-700">
                            Al seleccionar 2 comprobantes, se generará un PDF en formato A4 con ambos comprobantes 
                            (uno en la mitad superior y otro en la mitad inferior). Ideal para imprimir y cortar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
