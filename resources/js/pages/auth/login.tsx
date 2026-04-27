import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/shared/input-error';
import PasswordInput from '@/components/shared/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useLogin } from '@/hooks/useLogin';
import { useSplashScreen } from '@/hooks/useSplashScreen';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    const { branding } = usePage<any>().props;
    const { showSplash, fadeOut } = useSplashScreen();
    const { login, loading, errors } = useLogin();
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await login(formData);

        if (result.success) {
            const rol: string = result.data?.user?.rol ?? '';
            
            if (['padre_familia', 'madre_familia', 'apoderado'].includes(rol)) {
                window.location.href = '/dashboard';
            } else if (rol === 'docente') {
                window.location.href = '/docente/dashboard';
            } else if (rol === 'estudiante') {
                window.location.href = '/alumno/dashboard';
            } else {
                window.location.href = '/dashboard';
            }
        }
    };

    return (
        <>
            <Head title="Iniciar sesión" />

            {showSplash && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white"
                    style={{ opacity: fadeOut ? 0 : 1, transition: 'opacity 0.6s ease' }}
                >
                    <img
                        src="/anima_4.gif"
                        alt="Cargando..."
                        className="w-auto h-auto max-w-full max-h-full object-contain"
                    />
                </div>
            )}

            <div
                className="min-h-screen w-full flex flex-col items-center justify-center relative"
                style={{
                    backgroundImage: branding?.background ? `url(${branding.background})` : "url('/school.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-black/50" />

                <div className="relative z-10 w-full max-w-sm px-4 flex flex-col items-center gap-4">
                    <div className="w-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-center pt-8 pb-3">
                                <div className="size-32 rounded-full border-2 border-white/30 bg-white/10 p-2 shadow-2xl backdrop-blur-sm transition-transform hover:scale-110">
                                    <img
                                        src={branding?.logo || "/esama-bg.png"}
                                        alt="IEP Bautista La Pascana"
                                        className="h-full w-full rounded-full object-contain drop-shadow-lg"
                                    />
                                </div>
                            </div>

                        <div className="text-center px-8 pb-5">
                            <h1 className="text-xl font-bold text-white">IEP Bautista La Pascana</h1>
                            <p className="text-xs text-white/70 mt-1">Sistema de Gestión Educativa</p>
                        </div>

                        <div className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="username" className="text-white/90 text-sm">
                                        Usuario / DNI
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        autoFocus
                                        placeholder="Ingresa tu DNI o usuario"
                                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white"
                                    />
                                    {errors.username && <InputError message={errors.username} />}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="password" className="text-white/90 text-sm">
                                        Contraseña
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        placeholder="Contraseña"
                                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white"
                                    />
                                    {errors.password && <InputError message={errors.password} />}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-white text-black hover:bg-white/90 font-semibold mt-1"
                                >
                                    {loading && <Spinner />}
                                    Ingresar
                                </Button>

                                {errors.general && (
                                    <p className="text-center text-sm font-medium text-red-400">
                                        {errors.general}
                                    </p>
                                )}

                                {status && (
                                    <p className="text-center text-sm font-medium text-green-400">
                                        {status}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>

                    <img
                        src="/esama.png"
                        alt="Esama"
                        className="h-10 w-auto rounded-md opacity-80 shadow-sm transition-opacity hover:opacity-100"
                    />
                </div>
            </div>
        </>
    );
}
