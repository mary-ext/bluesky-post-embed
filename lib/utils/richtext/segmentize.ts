import { create_utf_string, get_utf8_length, slice_utf8 } from './unicode.ts';
import type { Facet, LinkFeature, MentionFeature, TagFeature } from './types.ts';

export interface RichTextSegment {
	text: string;
	link?: LinkFeature;
	mention?: MentionFeature;
	tag?: TagFeature;
}

const create_segment = (text: string, facet?: Facet): RichTextSegment => {
	let link: LinkFeature | undefined;
	let mention: MentionFeature | undefined;
	let tag: TagFeature | undefined;

	if (facet) {
		const features = facet.features;

		for (let idx = 0, len = features.length; idx < len; idx++) {
			const feature = features[idx];
			const type = feature.$type;

			if (type === 'app.bsky.richtext.facet#link') {
				link = feature;
			} else if (type === 'app.bsky.richtext.facet#mention') {
				mention = feature;
			} else if (type === 'app.bsky.richtext.facet#tag') {
				tag = feature;
			}
		}
	}

	return { text, link, mention, tag };
};

export const segment_richtext = (text: string, facets: Facet[] | undefined) => {
	if (!facets || facets.length < 1) {
		return [create_segment(text)];
	}

	const ustr = create_utf_string(text);

	const segments: RichTextSegment[] = [];
	const length = get_utf8_length(ustr);

	const facets_length = facets.length;

	let text_cursor = 0;
	let facet_cursor = 0;

	do {
		const facet = facets[facet_cursor];
		const { byteStart, byteEnd } = facet.index;

		if (text_cursor < byteStart) {
			segments.push(create_segment(slice_utf8(ustr, text_cursor, byteStart)));
		} else if (text_cursor > byteStart) {
			facet_cursor++;
			continue;
		}

		if (byteStart < byteEnd) {
			const subtext = slice_utf8(ustr, byteStart, byteEnd);

			if (!subtext.trim()) {
				// dont empty string entities
				segments.push(create_segment(subtext));
			} else {
				segments.push(create_segment(subtext, facet));
			}
		}

		text_cursor = byteEnd;
		facet_cursor++;
	} while (facet_cursor < facets_length);

	if (text_cursor < length) {
		segments.push(create_segment(slice_utf8(ustr, text_cursor, length)));
	}

	return segments;
};
