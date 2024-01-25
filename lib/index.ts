import rawStyles from './style.css?inline';
import { get, render } from './core.tsx';

let _style: CSSStyleSheet;
const get_style = () => {
	if (!_style) {
		_style = new CSSStyleSheet();
		_style.replaceSync(rawStyles);
	}

	return _style;
};

export class BlueskyPost extends HTMLElement {
	connectedCallback() {
		this.load().then(
			() => this.dispatchEvent(new CustomEvent('loaded')),
			(err) => this.dispatchEvent(new CustomEvent('error', { detail: err })),
		);
	}

	async load() {
		const src = this.getAttribute('src')!;
		const service = this.getAttribute('service-uri') || undefined;
		const contextless = this.getAttribute('contextless') !== null;

		const data = await get(src, contextless, service);

		const root = this.attachShadow({ mode: 'open' });
		root.adoptedStyleSheets = [get_style()];
		root.innerHTML = render(data, contextless).value;
	}
}

customElements.define('bluesky-post', BlueskyPost);
