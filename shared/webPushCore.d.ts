export interface PushLocalStore {
  load: () => any[] | Promise<any[]>;
  save: (list: any[]) => void | Promise<void>;
}

export const DEFAULT_VAPID_PUBLIC_KEY: string;
export const PUSH_SUBSCRIPTIONS_SQL: string;

export function uint8ArrayToBase64Url(bytes: Uint8Array): string;
export function base64UrlToUint8Array(base64String: string): Uint8Array;
export function getVapidConfig(env?: Record<string, any>): {
  publicKey: string;
  x: string;
  y: string;
  d: string;
  subject: string;
};

export function encryptWebPushPayload(
  subscription: {
    endpoint: string;
    keys?: { p256dh: string; auth: string };
    p256dh?: string;
    auth?: string;
  },
  payload: string | Record<string, any>
): Promise<Uint8Array>;

export function sendSingleWebPush(
  subscription: any,
  payload: any,
  env?: Record<string, any>
): Promise<{ ok: boolean; status: number; expired: boolean; error?: string }>;

export function resolveSupabasePushCredentials(env?: Record<string, any>): {
  url: string;
  key: string;
  valid: boolean;
};

export function upsertPushSubscription(
  rawSub: any,
  env?: Record<string, any>,
  localStore?: PushLocalStore | null
): Promise<{
  success: boolean;
  error?: string;
  persistedInSupabase?: boolean;
  supabaseConfigured?: boolean;
  supabaseError?: string | null;
  totalSubscribers?: number;
}>;

export function deletePushSubscription(
  endpoint: string,
  env?: Record<string, any>,
  localStore?: PushLocalStore | null
): Promise<{ success: boolean }>;

export function listPushSubscriptions(
  env?: Record<string, any>,
  localStore?: PushLocalStore | null
): Promise<{
  subscriptions: any[];
  supabaseConfigured: boolean;
  supabaseTableReady: boolean;
}>;

export function buildPriorityPushPayload(input?: Record<string, any>): Record<string, any>;

export function broadcastPriorityWebPush(
  input?: Record<string, any>,
  env?: Record<string, any>,
  localStore?: PushLocalStore | null
): Promise<{
  attempted: boolean;
  deduplicated?: boolean;
  sent: number;
  failed: number;
  removedExpired: number;
  totalSubscribers: number;
  supabaseConfigured?: boolean;
  supabaseTableReady?: boolean;
  message?: string;
  errors?: string[];
  payloadSummary?: { title: string; url: string };
}>;
