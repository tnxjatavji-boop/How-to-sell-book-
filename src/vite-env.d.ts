/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_PORTAL_PATH?: string;
  readonly VITE_ADMIN_GATE_KEY?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
