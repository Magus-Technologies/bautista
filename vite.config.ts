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
                    // React core — cargado siempre, pequeño chunk separado
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                        return 'react-core';
                    }
                    // Scanner QR — solo se carga en la página de asistencia
                    if (id.includes('html5-qrcode')) {
                        return 'scanner';
                    }
                    // Editor de texto rico — solo en páginas que lo usan
                    if (id.includes('tiptap') || id.includes('@tiptap') || id.includes('prosemirror')) {
                        return 'rich-editor';
                    }
                    // Inertia + router
                    if (id.includes('@inertiajs')) {
                        return 'inertia';
                    }
                    // Axios
                    if (id.includes('node_modules/axios')) {
                        return 'axios';
                    }
                    // Resto de node_modules → vendor genérico
                    if (id.includes('node_modules/')) {
                        return 'vendor';
                    }
                },
            },
        },
        // Aumentar el límite de warning de chunk (default 500kB)
        chunkSizeWarningLimit: 1000,
    },
});
