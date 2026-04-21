import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            command: `${process.env.PHP_BINARY || 'php'} artisan wayfinder:generate`,
            formVariants: true,
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // React core
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                        return 'react-core';
                    }
                    // Scanner QR — lazy, solo se descarga en /asistencia/scanner
                    if (id.includes('html5-qrcode')) {
                        return 'scanner';
                    }
                    // Quill editor — lazy, solo en modales de mensajería/anuncios
                    if (id.includes('node_modules/quill') || id.includes('node_modules/parchment') || id.includes('node_modules/quill-delta')) {
                        return 'rich-editor';
                    }
                    // Inertia
                    if (id.includes('node_modules/@inertiajs')) {
                        return 'inertia';
                    }
                    // Radix UI — se usa en toda la app pero es tree-shakeable, chunk propio para cache
                    if (id.includes('node_modules/@radix-ui')) {
                        return 'radix';
                    }
                    // Lucide icons — tree-shaken por Vite, chunk propio para cache
                    if (id.includes('node_modules/lucide-react')) {
                        return 'icons';
                    }
                    // date-fns — solo en páginas que muestran fechas
                    if (id.includes('node_modules/date-fns')) {
                        return 'date-fns';
                    }
                    // Axios
                    if (id.includes('node_modules/axios')) {
                        return 'axios';
                    }
                    // Resto de node_modules
                    if (id.includes('node_modules/')) {
                        return 'vendor';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
});
