import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
	plugins: [react(), svgr()],
	base: '/itfreelance/',
	server: { proxy: { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' } },
});
