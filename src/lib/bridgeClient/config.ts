// src/lib/bridgeClient/config.ts

export type BridgeClientConfig = {
  basePath?: string; // default: ""
  getAccessToken?: () => Promise<string | null>; // e.g. Supabase JWT
  getExtraHeaders?: () => Promise<Record<string, string>>; // optional
};

export const defaultBridgeConfig: BridgeClientConfig = {
  basePath: "",
};
