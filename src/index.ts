import '../lib/index.ts';
import type { BlueskyPost } from '../lib/index.ts';

import './style.css';

const dark = matchMedia('(prefers-color-scheme: dark)');

const update_theme = () => {
	const is_dark = dark.matches;

	for (const node of document.querySelectorAll<BlueskyPost>('bluesky-post')) {
		node.setAttribute('theme', !is_dark ? 'light' : 'dark');
	}
};

update_theme();
dark.addEventListener('change', update_theme);
