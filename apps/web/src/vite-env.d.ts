/// <reference types="vite/client" />
/// <reference types="node" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Apex domain for brand/center hosts (e.g. edunudg.com). Omit on *.vercel.app to use same-origin ?portal= mode. */
  readonly VITE_PORTAL_BASE_DOMAIN?: string;
  readonly VITE_DEFAULT_PORTAL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
