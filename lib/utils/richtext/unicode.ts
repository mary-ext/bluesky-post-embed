const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface UtfString {
	u16: string;
	u8: Uint8Array;
}

export const create_utf_string = (utf16: string): UtfString => {
	return {
		u16: utf16,
		u8: encoder.encode(utf16),
	};
};

export const get_utf8_length = (utf: UtfString) => {
	return utf.u8.byteLength;
};

export const slice_utf8 = (utf: UtfString, start?: number, end?: number) => {
	return decoder.decode(utf.u8.slice(start, end));
};
