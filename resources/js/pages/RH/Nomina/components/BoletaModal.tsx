import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Printer } from 'lucide-react';

type Nomina = {
    nomina_id: number;
    user: { nombre_completo: string };
    periodo: string;
    mes: number;
    anio: number;
    sueldo_base: number;
    bonificaciones: number;
    descuentos_tardanzas: number;
    total_descuentos: number;
    dias_trabajados: number;
    dias_ausentes: number;
    total_tardanzas: number;
    sueldo_neto: number;
    estado: string;
    estado_label: string;
    fecha_pago: string | null;
};

type Props = {
    open: boolean;
    nomina: Nomina | null;
    onClose: () => void;
};

export default function BoletaModal({ open, nomina, onClose }: Props) {
    if (!nomina) return null;

    const handlePrint = () => window.print();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <div className="p-2 print:p-6" id="boleta-content">
                    {/* Encabezado */}
                    <div className="text-center border-b pb-4 mb-4">
                        <h2 className="text-lg font-bold uppercase tracking-wide">Boleta de Pago</h2>
                        <p className="text-sm text-muted-foreground">{nomina.periodo}</p>
                    </div>

                    {/* Datos del trabajador */}
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Trabajador</span>
                            <span className="font-semibold">{nomina.user.nombre_completo}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Período</span>
                            <span>{nomina.periodo}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estado</span>
                            <span className={nomina.estado === 'pagado' ? 'text-emerald-600 font-medium' : nomina.estado === 'aprobado' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                {nomina.estado_label}
                            </span>
                        </div>
                        {nomina.fecha_pago && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Fecha de pago</span>
                                <span>{nomina.fecha_pago}</span>
                            </div>
                        )}
                    </div>

                    {/* Asistencia */}
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Resumen de Asistencia</h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-green-50 rounded p-2">
                                <p className="text-xl font-bold text-green-700">{nomina.dias_trabajados}</p>
                                <p className="text-xs text-muted-foreground">Días trabajados</p>
                            </div>
                            <div className="bg-red-50 rounded p-2">
                                <p className="text-xl font-bold text-red-600">{nomina.dias_ausentes}</p>
                                <p className="text-xs text-muted-foreground">Ausencias</p>
                            </div>
                            <div className="bg-orange-50 rounded p-2">
                                <p className="text-xl font-bold text-orange-600">{nomina.total_tardanzas}</p>
                                <p className="text-xs text-muted-foreground">Tardanzas</p>
                            </div>
                        </div>
                    </div>

                    {/* Ingresos y descuentos */}
                    <div className="mb-4 space-y-1">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Detalle de Haberes</h3>
                        <Row label="Sueldo Base" value={formatCurrency(nomina.sueldo_base)} />
                        <Row label="Bonificaciones" value={formatCurrency(nomina.bonificaciones)} />
                        <div className="border-t my-2" />
                        <Row label="Desc. por tardanzas" value={`-${formatCurrency(nomina.descuentos_tardanzas)}`} red />
                        <Row label="Total descuentos" value={`-${formatCurrency(nomina.total_descuentos)}`} red />
                    </div>

                    {/* Total neto */}
                    <div className="bg-green-600 text-white rounded-lg p-3 flex justify-between items-center">
                        <span className="font-semibold">SUELDO NETO A PAGAR</span>
                        <span className="text-xl font-bold">{formatCurrency(nomina.sueldo_neto)}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={handlePrint} className="gap-2 bg-slate-700 hover:bg-slate-800 text-white">
                        <Printer className="size-4" /> Imprimir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Row({ label, value, red }: { label: string; value: string; red?: boolean }) {
    return (
        <div className="flex justify-between text-sm py-0.5">
            <span className="text-muted-foreground">{label}</span>
            <span className={red ? 'text-red-600 font-medium' : 'font-medium'}>{value}</span>
        </div>
    );
}
