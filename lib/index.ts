import rawStyles from './style.css?inline';
import { render } from './core.tsx';

import { Agent } from './utils/agent.ts';

let _style: CSSStyleSheet;
const get_style = () => {
	if (!_style) {
		_style = new CSSStyleSheet();
		_style.replaceSync(rawStyles);
	}

	return _style;
};

const parse_src = (src: string): [actor: string, rkey: string] => {
	const { protocol, host, pathname } = new URL(src);

	if (protocol === 'https:' || protocol === 'http:') {
		if (host === 'bsky.app' || host === 'staging.bsky.app') {
			const match = /\/profile\/([^/]+)\/post\/([^/]+)\/?$/.exec(pathname);

			if (match) {
				return [match[1], match[2]];
			}
		}
	}

	throw new RangeError(`Invalid src: ${src}`);
};

const resolve_actor = async (agent: Agent, actor: string): Promise<string> => {
	if (actor.startsWith('did:')) {
		return actor;
	}

	const response = await agent.get('com.atproto.identity.resolveHandle', {
		params: {
			handle: actor,
		},
	});

	return response.data.did;
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
		const appview_url = this.getAttribute('service-uri') ?? `https://api.bsky.app`;
		const contextless = this.getAttribute('contextless') !== null;

		const agent = new Agent(appview_url);

		const [actor, rkey] = parse_src(src);
		const did = await resolve_actor(agent, actor);

		const response = await agent.get('app.bsky.feed.getPostThread', {
			params: {
				uri: `at://${did}/app.bsky.feed.post/${rkey}`,
				parentHeight: !contextless ? 2 : 1,
				depth: 0,
			},
		});

		const data = response.data;

		const root = this.attachShadow({ mode: 'open' });
		root.adoptedStyleSheets = [get_style()];
		root.innerHTML = render(data, contextless).value;
	}
}

customElements.define('bluesky-post', BlueskyPost);
