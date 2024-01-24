import type { RefOf, UnionOf } from '@externdefs/bluesky-client/atp-schema';

export type Facet = RefOf<'app.bsky.richtext.facet'>;
export type LinkFeature = UnionOf<'app.bsky.richtext.facet#link'>;
export type MentionFeature = UnionOf<'app.bsky.richtext.facet#mention'>;
export type TagFeature = UnionOf<'app.bsky.richtext.facet#tag'>;
