# &lt;bluesky-post>

A custom element for embedding Bluesky posts. [Live demo](https://mary-ext.github.io/bluesky-post-embed)

- **Lightweight**, the entire package + dependencies is only 24 KB (7 KB gzipped)
- **Standalone**, no additional middleman involved, connects straight to Bluesky's API

## Installation

### via package manager

This custom element is available on npm.

```
npm install bluesky-post-embed
```

Then, import the package on your app.

```js
import 'bluesky-post-embed';
```

### via CDN

If you like, you can also rely on CDN services like esm.sh or JSDelivr.

```html
<script type="module" src="https://esm.sh/bluesky-post-embed@~0.1.0"></script>
```

## Usage

Bluesky posts can be embedded like so:

```html
<bluesky-post src="https://bsky.app/profile/pfrazee.com/post/3kj2umze7zj2n" theme="light">
	<blockquote class="bluesky-post-fallback">
		<p dir="auto">angel mode</p>
		&mdash; Paul Frazee 🦋 (@pfrazee.com)
		<a href="https://bsky.app/profile/pfrazee.com/post/3kj2umze7zj2n">January 16, 2024</a>
	</blockquote>
</bluesky-post>
```

Adding a fallback content like above is heavily recommended for progressive enhancement.

### Attributes

- `src` **Required**  
  A `bsky.app` URL of the post.  
  Heavily recommended that the URL points to a DID instead of a handle, otherwise, it would have to
  resolve the handle into DID first (and suffer from issues like users changing their handles, etc)  
  An example of such URL would be: https://bsky.app/profile/did:plc:ragtjsm2j2vknwkz3zp4oxrd/post/3kj2umze7zj2n
- `contextless` **Optional**  
  Prevent displaying of context when `src` points to a reply.
- `theme` **Semi-required**  
  The color palette that it should use, either `light` or `dark`.  
  Set this to blank if you're setting a custom color palette.
- `service-uri` **Optional**  
  URL to an AppView service, defaults to `https://public.api.bsky.app`

### Events

- `loaded`  
  Fired when the embed has successfully loaded the post
- `error`  
  Fired when the embed fails to load the post

## SSR usage

The core of this package is a static HTML renderer, so long as your framework of
choice has the means to deal with declarative shadow DOM, then it's possible to
generate a completely static embed without any JavaScript in the client.

See [this repository](https://github.com/mary-ext/astro-bluesky-post) for an
SSR demo made in Astro.
