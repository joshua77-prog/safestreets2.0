import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			}
		}
	},
	resolve: {
		alias: {
			'@/components': path.resolve(__dirname, 'components'),
			'@/entities': path.resolve(__dirname, 'entities'),
			'@/utils': path.resolve(__dirname, 'utils'),
		},
		extensions: ['.js', '.jsx', '.ts', '.tsx']
	}
});


