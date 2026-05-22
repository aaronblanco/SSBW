import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        base: command === 'build' ? '/react/' : '/',
        plugins: [react(), tailwindcss()],
    });
});
