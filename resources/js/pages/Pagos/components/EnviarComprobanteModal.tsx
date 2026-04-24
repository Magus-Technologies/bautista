import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Mail, Send, Copy, Check } from 'lucide-react';
import axios from 'axios';

interface Props {
    open: boolean;
    onClose: () => void;
    comprobanteId: number | null;
    defaultPhone?: string;
    defaultEmail?: string;
}

export default function EnviarComprobanteModal({
    open,
    onClose,
    comprobanteId,
    defaultPhone = '',
    defaultEmail = ''
}: Props) {
    const [phone, setPhone] = useState(defaultPhone);
    const [email, setEmail] = useState(defaultEmail);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setPhone(defaultPhone);
        setEmail(defaultEmail);
    }, [defaultPhone, defaultEmail, open]);

    useEffect(() => {
        if (open && comprobanteId) {
            generatePdfUrl();
        }
    }, [open, comprobanteId]);

    const generatePdfUrl = async () => {
        if (!comprobanteId) return;
        
        try {
            setLoading(true);
            const { data } = await axios.post(`/api/comprobantes/${comprobanteId}/pdf-token`);
            const url = `${window.location.origin}/comprobantes/${comprobanteId}/pdf?token=${data.token}`;
            setPdfUrl(url);
        } catch (error) {
            console.error('Error generando URL del PDF:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnviarWhatsApp = () => {
        if (!phone || !pdfUrl) return;

        // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Mensaje personalizado
        const mensaje = `Hola! Te envío tu comprobante electrónico. Puedes descargarlo aquí: ${pdfUrl}`;
        
        // Abrir WhatsApp Web con el mensaje
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleEnviarEmail = () => {
        if (!email || !pdfUrl) return;

        // Asunto y cuerpo del correo
        const subject = 'Tu Comprobante Electrónico';
        const body = `Hola,\n\nTe envío tu comprobante electrónico.\n\nPuedes descargarlo en el siguiente enlace:\n${pdfUrl}\n\nSaludos.`;
        
        // Abrir cliente de correo
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    };

    const handleCopiarUrl = () => {
        if (!pdfUrl) return;
        navigator.clipboard.writeText(pdfUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="size-5 text-blue-600" />
                        Enviar Comprobante
                    </DialogTitle>
                    <DialogDescription>
                        Elige cómo deseas enviar el comprobante electrónico
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* URL del PDF */}
                    {pdfUrl && (
                        <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Label className="text-xs font-semibold text-gray-700">URL del Comprobante</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={pdfUrl}
                                    readOnly
                                    className="font-mono text-xs bg-white"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopiarUrl}
                                    className="shrink-0 gap-1.5"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="size-3.5 text-green-600" />
                                            Copiado
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" />
                                            Copiar
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                ⏱️ Este enlace es válido por 5 minutos
                            </p>
                        </div>
                    )}

                    {/* WhatsApp */}
                    <div className="space-y-3 p-4 border border-green-200 rounded-lg bg-green-50/50">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="size-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">Enviar por WhatsApp</h3>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm">Número de Teléfono</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Ej: 51987654321"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="font-mono bg-white"
                            />
                            <p className="text-xs text-gray-600">
                                Incluye el código de país (Ej: 51 para Perú)
                            </p>
                        </div>
                        <Button
                            onClick={handleEnviarWhatsApp}
                            disabled={!phone || !pdfUrl || loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                            <MessageCircle className="size-4" />
                            Abrir WhatsApp
                        </Button>
                    </div>

                    {/* Email */}
                    <div className="space-y-3 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                        <div className="flex items-center gap-2">
                            <Mail className="size-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Enviar por Correo</h3>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <Button
                            onClick={handleEnviarEmail}
                            disabled={!email || !pdfUrl || loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Mail className="size-4" />
                            Abrir Cliente de Correo
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
