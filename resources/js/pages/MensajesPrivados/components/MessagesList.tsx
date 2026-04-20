import { Inbox, Send, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Mensaje } from '../hooks/useMensajes';
import MessageRow from '@/pages/MensajesPrivados/components/MessageRow';

type Props = {
    recibidos: Mensaje[];
    enviados: Mensaje[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
};

export default function MessagesList({
    recibidos,
    enviados,
}: Props) {
    return (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <Tabs defaultValue="recibidos" className="w-full">
                <div className="px-4 sm:px-6 py-4 border-b border-neutral-100 bg-neutral-50">
                    <TabsList className="bg-gray-100 p-1 rounded-xl h-auto gap-1 w-full sm:w-auto">
                        <TabsTrigger
                            value="recibidos"
                            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow flex-1 sm:flex-none"
                        >
                            <Inbox className="size-3.5" />
                            Recibidos
                        </TabsTrigger>
                        <TabsTrigger
                            value="enviados"
                            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow flex-1 sm:flex-none"
                        >
                            <Send className="size-3.5" />
                            Enviados
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="recibidos" className="m-0">
                    {recibidos.length === 0 ? (
                        <EmptyState text="No hay mensajes en tu bandeja de entrada" />
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {recibidos.map((m) => (
                                <MessageRow key={m.id} message={m} type="inbox" />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="enviados" className="m-0">
                    {enviados.length === 0 ? (
                        <EmptyState text="Aún no has enviado ningún mensaje" />
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {enviados.map((m) => (
                                <MessageRow key={m.id} message={m} type="sent" />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300">
                <Mail className="w-10 h-10" />
            </div>
            <p className="text-neutral-500 font-medium">{text}</p>
        </div>
    );
}
