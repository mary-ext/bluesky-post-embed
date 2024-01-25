import type { TrustedHTML } from '@intrnl/jsx-to-string';
import type { Records, RefOf, ResponseOf } from '@externdefs/bluesky-client/atp-schema';

import './style.css';

import { Agent } from './utils/agent.ts';

import { segment_richtext } from './utils/richtext/segmentize.ts';
import type { Facet } from './utils/richtext/types.ts';

import { format_abs_date, format_abs_date_time } from './utils/date.ts';
import { format_compact } from './utils/number.ts';

type ThreadResponse = ResponseOf<'app.bsky.feed.getPostThread'>;
type PostData = RefOf<'app.bsky.feed.defs#postView'>;
type PostRecord = Records['app.bsky.feed.post'];

/// Fetch post
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

export const get = async (
	src: string,
	contextless: boolean,
	service: string = 'https://api.bsky.app',
): Promise<ThreadResponse> => {
	const agent = new Agent(service);

	const [actor, rkey] = parse_src(src);

	let did: string;
	if (actor.startsWith('did:')) {
		did = actor;
	} else {
		const response = await agent.get('com.atproto.identity.resolveHandle', {
			params: {
				handle: actor,
			},
		});

		did = response.data.did;
	}

	const response = await agent.get('app.bsky.feed.getPostThread', {
		params: {
			uri: `at://${did}/app.bsky.feed.post/${rkey}`,
			parentHeight: !contextless ? 2 : 1,
			depth: 0,
		},
	});

	const data = response.data;

	return data;
};

/// Renderer
const get_record_key = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

const get_collection_ns = (uri: string) => {
	const first = uri.indexOf('/', 5);
	const second = uri.indexOf('/', first + 1);

	return uri.slice(first + 1, second);
};

const get_profile_url = (author: string) => {
	return `https://bsky.app/profile/${author}`;
};

const get_post_url = (author: string, rkey: string) => {
	return `https://bsky.app/profile/${author}/post/${rkey}`;
};

export const render = (resp: ThreadResponse, contextless: boolean): TrustedHTML => {
	const posts = unwrap_thread(resp, contextless);
	const len = posts.length;

	if (len === 0) {
		return (
			<div class="root">
				<p class="not-available">This post is unavailable</p>
			</div>
		);
	}

	const reply_icon = (
		<svg viewBox="0 0 24 24" class="icon">
			<path fill="currentColor" d="M10 9V5l-7 7l7 7v-4.1c5 0 8.5 1.6 11 5.1c-1-5-4-10-11-11" />
		</svg>
	);

	return (
		<div class="root">
			<div class="timeline">
				{posts.map(({ post, parent }, i) => {
					const main = i === len - 1;

					const record = post.record as PostRecord;
					const author = post.author;

					const author_url = get_profile_url(author.handle);
					const post_url = get_post_url(author.handle, get_record_key(post.uri));

					if (main) {
						return (
							<div class="main-post">
								<div class="main-post__header">
									<a href={author_url} target="_blank" class="main-post__avatar-wrapper">
										{author.avatar ? (
											<img loading="lazy" src={author.avatar} class="main-post__avatar" />
										) : null}
									</a>

									<a href={author_url} target="_blank" class="main-post__name-wrapper">
										<bdi class="main-post__display-name-wrapper">
											<span class="main-post__display-name">{author.displayName}</span>
										</bdi>
										<span class="main-post__handle">@{author.handle}</span>
									</a>
								</div>

								{i === 0 && record.reply ? (
									<p class="main-post__context">
										{reply_icon}
										{parent ? (
											<span>
												Reply to{' '}
												<a
													href={`https://bsky.app/profile/${parent.author.handle}`}
													target="_blank"
													class="main-post__context-link"
												>
													{parent.author.displayName || '@' + parent.author.handle}
												</a>
											</span>
										) : (
											<span>Reply to an unknown post</span>
										)}
									</p>
								) : null}

								<div class="main-post__body">
									<RichTextRenderer text={record.text} facets={record.facets} />
								</div>

								{post.embed ? <Embeds embed={post.embed} large={true} /> : null}

								{record.tags ? (
									<div class="main-post__tags">
										{record.tags.map((tag) => (
											<div class="main-post__tag">
												<span>#</span>
												<span class="main-post__tag-text">{tag}</span>
											</div>
										))}
									</div>
								) : null}

								<div class="main-post__footer">
									<a href={post_url} target="_blank" class="main-post__date">
										<time datetime={record.createdAt}>{format_abs_date_time(record.createdAt)}</time>
									</a>

									<span aria-hidden="true" class="dot">
										·
									</span>

									<span class="main-post__stats">
										<span class="main-post__stat" title={`${post.replyCount || 0} replies`}>
											{reply_icon}
											<span>{format_compact(post.replyCount || 0)}</span>
										</span>

										<span class="main-post__stat" title={`${post.likeCount || 0} likes`}>
											<svg viewBox="0 0 24 24" class="icon">
												<path
													fill="currentColor"
													d="m11.645 20.91l-.007-.003l-.022-.012a15.247 15.247 0 0 1-.383-.218a25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25C2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052A5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25c0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17a15.247 15.247 0 0 1-.383.219l-.022.012l-.007.004l-.003.001a.752.752 0 0 1-.704 0z"
												></path>
											</svg>
											<span>{format_compact(post.likeCount || 0)}</span>
										</span>

										<span class="main-post__stat" title={`${post.repostCount || 0} reposts`}>
											<svg viewBox="0 0 24 24" class="icon">
												<path
													fill="currentColor"
													d="M7 7h10v3l4-4l-4-4v3H5v6h2zm10 10H7v-3l-4 4l4 4v-3h12v-6h-2z"
												></path>
											</svg>
											<span>{format_compact(post.repostCount || 0)}</span>
										</span>
									</span>
								</div>
							</div>
						);
					} else {
						return (
							<div class="reply-post">
								<div class="reply-post__aside">
									<a href={author_url} target="_blank" class="reply-post__avatar-wrapper">
										{author.avatar ? (
											<img loading="lazy" src={author.avatar} class="reply-post__avatar" />
										) : null}
									</a>

									<div class="reply-post__line"></div>
								</div>

								<div class="reply-post__main">
									<div class="reply-post__header">
										<a href={author_url} target="_blank" class="reply-post__name-wrapper">
											<bdi class="reply-post__display-name-wrapper">
												<span class="reply-post__display-name">{author.displayName}</span>
											</bdi>

											<span class="reply-post__handle">@{author.handle}</span>
										</a>

										<span aria-hidden="true" class="dot">
											·
										</span>

										<a
											href={post_url}
											target="_blank"
											title={format_abs_date_time(record.createdAt)}
											class="reply-post__date"
										>
											<time datetime={record.createdAt}>{format_abs_date(record.createdAt)}</time>
										</a>
									</div>

									{i === 0 && record.reply ? (
										<p class="reply-post__context">
											<svg viewBox="0 0 24 24" class="icon">
												<path
													fill="currentColor"
													d="M10 9V5l-7 7l7 7v-4.1c5 0 8.5 1.6 11 5.1c-1-5-4-10-11-11"
												/>
											</svg>
											{parent ? (
												<span>
													Reply to{' '}
													<a
														href={`https://bsky.app/profile/${parent.author.handle}`}
														target="_blank"
														class="reply-post__context-link"
													>
														{parent.author.displayName || '@' + parent.author.handle}
													</a>
												</span>
											) : (
												<span>Reply to an unknown post</span>
											)}
										</p>
									) : null}

									<div class="reply-post__body">
										<RichTextRenderer text={record.text} facets={record.facets} />
									</div>

									{post.embed ? <Embeds embed={post.embed} large={false} /> : null}
								</div>
							</div>
						);
					}
				})}
			</div>
		</div>
	);
};

const unwrap_thread = (resp: ThreadResponse, contextless: boolean) => {
	const items: { post: PostData; parent: PostData | undefined }[] = [];

	let i = 0;
	let il = contextless ? 1 : 2;

	let curr: typeof resp.thread | undefined = resp.thread;
	while (curr) {
		if (curr.$type === 'app.bsky.feed.defs#notFoundPost' || curr.$type === 'app.bsky.feed.defs#blockedPost') {
			break;
		}

		const post = curr.post;

		if (i !== 0) {
			items[i - 1].parent = post;
		}

		if (++i > il) {
			break;
		}

		const author = post.author;
		if (author.labels?.some((def) => def.val === '!no-unauthenticated')) {
			break;
		}

		items.push({ post: post, parent: undefined });
		curr = curr.parent;
	}

	return items.reverse();
};

/// <RichTextRenderer />
const RichTextRenderer = ({ text, facets }: { text: string; facets?: Facet[] }) => {
	const segments = segment_richtext(text, facets);

	return (
		<>
			{segments.map((segment) => {
				const text = segment.text;

				const link = segment.link;
				const mention = segment.mention;
				const tag = segment.tag;

				if (link) {
					return (
						<a href={link.uri} target="_blank" class="link">
							{text}
						</a>
					);
				} else if (mention) {
					return (
						<a href={`https://bsky.app/profile/${mention.did}`} target="_blank" class="mention">
							{text}
						</a>
					);
				} else if (tag) {
					return <span class="hashtag">{text}</span>;
				}

				return text;
			})}
		</>
	);
};

/// <Embeds />
type EmbeddedImage = RefOf<'app.bsky.embed.images#viewImage'>;
type EmbeddedLink = RefOf<'app.bsky.embed.external#viewExternal'>;
type EmbeddedRecord = RefOf<'app.bsky.embed.record#view'>['record'];

const Embeds = ({ embed, large }: { embed: NonNullable<PostData['embed']>; large: boolean }) => {
	let images: EmbeddedImage[] | undefined;
	let link: EmbeddedLink | undefined;
	let record: EmbeddedRecord | undefined;

	{
		const $type = embed.$type;

		if ($type === 'app.bsky.embed.images#view') {
			images = embed.images;
		} else if ($type === 'app.bsky.embed.external#view') {
			link = embed.external;
		} else if ($type === 'app.bsky.embed.record#view') {
			record = embed.record;
		} else if ($type === 'app.bsky.embed.recordWithMedia#view') {
			const rec = embed.record.record;

			const media = embed.media;
			const mediatype = media.$type;

			record = rec;

			if (mediatype === 'app.bsky.embed.images#view') {
				images = media.images;
			} else if (mediatype === 'app.bsky.embed.external#view') {
				link = media.external;
			}
		}
	}

	return (
		<div class="embeds">
			{link ? <EmbedLink link={link} /> : null}
			{images ? <EmbedImage images={images} is_bordered={true} allow_standalone_ratio={true} /> : null}
			{record ? render_record(record, large) : null}
		</div>
	);
};

const render_record = (record: EmbeddedRecord, large: boolean) => {
	const $type = record.$type;

	if ($type === 'app.bsky.embed.record#viewNotFound' || $type === 'app.bsky.embed.record#viewBlocked') {
		return <EmbedNotFound uri={record.uri} />;
	}

	if ($type === 'app.bsky.embed.record#viewRecord') {
		const author = record.author;
		if (author.labels?.some((def) => def.val === '!no-unauthenticated')) {
			return <EmbedNotFound uri={record.uri} />;
		}

		return <EmbedPost post={record} large={large} />;
	}

	if ($type === 'app.bsky.feed.defs#generatorView') {
		return <EmbedFeed feed={record} />;
	}

	if ($type === 'app.bsky.graph.defs#listView') {
		return <EmbedList list={record} />;
	}

	return null;
};

/// <EmbedNotFound />
const EmbedNotFound = ({ uri }: { uri: string }) => {
	const ns = get_collection_ns(uri);
	const resource =
		ns === 'app.bsky.feed.post'
			? 'post'
			: ns === 'app.bsky.feed.generator'
				? 'feed'
				: ns === 'app.bsky.graph.list'
					? 'list'
					: 'record';

	return <p class="embed-not-found">This {resource} is unavailable</p>;
};

/// <EmbedLink />
const EmbedLink = ({ link }: { link: EmbeddedLink }) => {
	return (
		<a href={link.uri} target="_blank" rel="noopener noreferrer nofollow" class="embed-link interactive">
			{link.thumb ? <img loading="lazy" src={link.thumb} class="embed-link__thumb" /> : null}

			<div class="embed-link__main">
				<p class="embed-link__domain">{get_domain(link.uri)}</p>
				<p class="embed-link__title">{link.title}</p>

				<div class="embed-link__desktop-only">
					<p class="embed-link__summary">{link.description}</p>
				</div>
			</div>
		</a>
	);
};

const get_domain = (url: string) => {
	try {
		const host = new URL(url).host;
		return host.startsWith('www.') ? host.slice(4) : host;
	} catch {
		return url;
	}
};

/// <EmbedImage />
const enum RenderMode {
	MULTIPLE,
	STANDALONE,
	STANDALONE_RATIO,
}

const EmbedImage = ({
	images,
	is_bordered,
	allow_standalone_ratio,
}: {
	images: EmbeddedImage[];
	is_bordered: boolean;
	allow_standalone_ratio: boolean;
}) => {
	const length = images.length;
	const is_standalone_image = allow_standalone_ratio && length === 1 && 'aspectRatio' in images[0];

	return (
		<div
			class={
				'embed-image' +
				(is_bordered ? ' embed-image--bordered' : '') +
				(is_standalone_image ? ' embed-image--standalone' : '')
			}
		>
			{is_standalone_image ? (
				render_img(images[0], RenderMode.STANDALONE_RATIO)
			) : length === 1 ? (
				render_img(images[0], RenderMode.STANDALONE)
			) : length === 2 ? (
				<div class="embed-image__grid">
					<div class="embed-image__col">{render_img(images[0], RenderMode.MULTIPLE)}</div>
					<div class="embed-image__col">{render_img(images[1], RenderMode.MULTIPLE)}</div>
				</div>
			) : length === 3 ? (
				<div class="embed-image__grid">
					<div class="embed-image__col">
						{render_img(images[0], RenderMode.MULTIPLE)}
						{render_img(images[1], RenderMode.MULTIPLE)}
					</div>

					<div class="embed-image__col">{render_img(images[2], RenderMode.MULTIPLE)}</div>
				</div>
			) : length === 4 ? (
				<div class="embed-image__grid">
					<div class="embed-image__col">
						{render_img(images[0], RenderMode.MULTIPLE)}
						{render_img(images[2], RenderMode.MULTIPLE)}
					</div>

					<div class="embed-image__col">
						{render_img(images[1], RenderMode.MULTIPLE)}
						{render_img(images[3], RenderMode.MULTIPLE)}
					</div>
				</div>
			) : null}
		</div>
	);
};

const render_img = (img: EmbeddedImage, mode: RenderMode) => {
	// FIXME: with STANDALONE_RATIO, we are resizing the image to make it fit
	// the container with our given constraints, but this doesn't work when the
	// image hasn't had its metadata loaded yet, the browser will snap to the
	// smallest possible size for our layout.

	const alt = img.alt;
	const aspectRatio = img.aspectRatio;

	let cn: string | undefined;
	let ratio: string | undefined;

	if (mode === RenderMode.MULTIPLE) {
		cn = `embed-image__image-wrapper--multiple`;
	} else if (mode === RenderMode.STANDALONE) {
		cn = `embed-image__image-wrapper--standalone`;
	} else if (mode === RenderMode.STANDALONE_RATIO) {
		cn = `embed-image__image-wrapper--standalone-ratio`;
		ratio = `${aspectRatio!.width}/${aspectRatio!.height}`;
	}

	return (
		<div class={'embed-image__image-wrapper ' + cn} style={{ 'aspect-ratio': ratio }}>
			<img loading="lazy" src={img.thumb} alt={alt} class="embed-image__image" />
			{mode === RenderMode.STANDALONE_RATIO ? <div class="embed-image__placeholder"></div> : null}
		</div>
	);
};

/// <EmbedPost />
const EmbedPost = ({ post, large }: { post: RefOf<'app.bsky.embed.record#viewRecord'>; large: boolean }) => {
	const author = post.author;

	const record = post.value as PostRecord;
	const text = record.text;
	const images = get_post_images(post);

	const show_large_images = images !== undefined && (large || !text);

	const post_url = get_post_url(author.handle, get_record_key(post.uri));

	return (
		<a href={post_url} target="_blank" class="embed-post interactive">
			<div class="embed-post__header">
				<div class="embed-post__avatar-wrapper">
					{author.avatar ? <img loading="lazy" src={author.avatar} class="embed-post__avatar" /> : null}
				</div>

				<span class="embed-post__name-wrapper">
					{author.displayName ? (
						<bdi class="embed-post__display-name-wrapper">
							<span class="embed-post__display-name">{author.displayName}</span>
						</bdi>
					) : null}

					<span class="embed-post__handle">@{author.handle}</span>
				</span>

				<span aria-hidden="true" class="dot">
					·
				</span>

				<span class="embed-post__date">{format_abs_date(record.createdAt)}</span>
			</div>

			{text ? (
				<div class="embed-post__body">
					{images && !large ? (
						<div class="embed-post__image-aside">
							<EmbedImage images={images} is_bordered={true} allow_standalone_ratio={false} />
						</div>
					) : null}

					<div class="embed-post__text">{text}</div>
				</div>
			) : null}

			{show_large_images ? (
				<>
					{text ? <div class="embed-post__divider"></div> : null}
					<EmbedImage images={images} is_bordered={false} allow_standalone_ratio={false} />
				</>
			) : null}
		</a>
	);
};

const get_post_images = (post: RefOf<'app.bsky.embed.record#viewRecord'>) => {
	const embeds = post.embeds;

	if (embeds && embeds.length > 0) {
		const val = embeds[0];

		if (val.$type === 'app.bsky.embed.images#view') {
			return val.images;
		} else if (val.$type === 'app.bsky.embed.recordWithMedia#view') {
			const media = val.media;

			if (media.$type === 'app.bsky.embed.images#view') {
				return media.images;
			}
		}
	}
};

/// <EmbedFeed />
const EmbedFeed = ({ feed }: { feed: RefOf<'app.bsky.feed.defs#generatorView'> }) => {
	const creator = feed.creator;

	const feed_url = `https://bsky.app/profile/${creator.handle}/feed/${get_record_key(feed.uri)}`;

	return (
		<a href={feed_url} target="_blank" class="embed-feed interactive">
			<div class="embed-feed__avatar-wrapper">
				{feed.avatar ? <img loading="lazy" src={feed.avatar} class="embed-feed__avatar" /> : null}
			</div>

			<div class="embed-feed__main">
				<p class="embed-feed__name">{feed.displayName}</p>
				<p class="embed-feed__type">{`Feed by @${creator.handle}`}</p>
			</div>
		</a>
	);
};

/// <EmbedList />
const EmbedList = ({ list }: { list: RefOf<'app.bsky.graph.defs#listView'> }) => {
	const creator = list.creator;

	const raw_purpose = list.purpose;
	const purpose =
		raw_purpose === 'app.bsky.graph.defs#curatelist'
			? `Curation list`
			: raw_purpose === 'app.bsky.graph.defs#modlist'
				? `Moderation list`
				: `Unknown list`;

	const list_url = `https://bsky.app/profile/${creator.handle}/list/${get_record_key(list.uri)}`;

	return (
		<a href={list_url} target="_blank" class="embed-list interactive">
			<div class="embed-list__avatar-wrapper">
				{list.avatar ? <img loading="lazy" src={list.avatar} class="embed-list__avatar" /> : null}
			</div>

			<div class="embed-list__main">
				<p class="embed-list__name">{list.name}</p>
				<p class="embed-list__type">{`${purpose} by ${creator.handle}`}</p>
			</div>
		</a>
	);
};
