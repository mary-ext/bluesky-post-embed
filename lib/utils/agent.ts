import type { Procedures, Queries } from '@externdefs/bluesky-client/atp-schema';
import { XRPC } from '@externdefs/bluesky-client/xrpc';

export type Agent = XRPC<Queries, Procedures>;
export const Agent = XRPC<Queries, Procedures>;
