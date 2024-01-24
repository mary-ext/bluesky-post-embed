# &lt;bluesky-post>

A custom element for embedding Bluesky posts, connects to Bluesky's API directly with no middleman involved.

[Live demo](https://mary-ext.github.io/bluesky-post-embed)

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

If you like, you can also rely on CDN services like JSDelivr.

```html
<script type="module" src="https://esm.run/bluesky-post-embed"></script>
```

## Basic usage

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

## Attributes

- `src` **Required**  
  A `bsky.app` URL of the post. If set to a handle-based URL, it'll attempt to resolve the handle.
- `contextless` **Optional**  
  Prevent displaying of context when `src` points to a reply.
- `theme` **Semi-required**  
  The color palette that it should use, either `light` or `dark`.  
  Set this to blank if you're setting a custom color palette.
- `service-uri` **Optional**  
  URL to an AppView service, defaults to `https://api.bsky.app`

## Events

- `loaded`  
  Fired when the embed has successfully loaded the post
- `error`  
  Fired when the embed fails to load the post
