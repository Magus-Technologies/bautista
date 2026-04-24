import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function GenerateNominaModal({ open, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [mes, setMes] = useState<string>((new Date().getMonth() + 1).toString());
    const [anio, setAnio] = useState<string>(new Date().getFullYear().toString());

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/rh/nomina/generar', {
                mes: parseInt(mes),
                anio: parseInt(anio)
            });
            alert(response.data.message || 'Nómina generada correctamente');
            onSuccess();
        } catch (error: any) {
            console.error('Error al generar nómina:', error);
            alert(error.response?.data?.message || 'Error al generar la nómina');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Generar Nómina Mensual</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Mes de la Nómina</Label>
                        <Select value={mes} onValueChange={setMes}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {new Date(0, i).toLocaleString('es-PE', { month: 'long' }).toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Año</Label>
                        <Select value={anio} onValueChange={setAnio}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-md">
                        Esta acción calculará automáticamente los sueldos, tardanzas y descuentos de todos los trabajadores con contrato activo para el período seleccionado.
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? 'Generando...' : 'Generar Ahora'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
