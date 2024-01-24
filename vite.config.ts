import { defineConfig } from 'vite';

import babel from '@rollup/plugin-babel';
import dts from 'vite-plugin-dts';

export default defineConfig({
	base: '/',
	optimizeDeps: {
		include: ['@intrnl/jsx-to-string/runtime'],
	},
	build: {
		sourcemap: true,
		target: 'esnext',
		minify: false,
		cssMinify: true,
		lib: {
			entry: 'lib/index.ts',
			fileName: `bluesky-post-embed`,
			formats: ['es'],
		},
		rollupOptions: {
			external: [
				'@externdefs/bluesky-client/agent',
				'@externdefs/bluesky-client/xrpc',
				'@externdefs/bluesky-client/atp-schema',
			],
		},
	},
	esbuild: {
		target: 'es2022',
	},
	plugins: [
		{
			enforce: 'pre',
			...babel({
				babelrc: false,
				babelHelpers: 'bundled',
				extensions: ['.tsx'],
				plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }], ['@intrnl/jsx-to-string/babel']],
			}),
		},
		dts({ rollupTypes: true }),
	],
});
