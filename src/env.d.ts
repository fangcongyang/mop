interface ImportMetaEnv {
    readonly VITE_APP_LASTFM_API_KEY: string;
    readonly VITE_APP_LASTFM_API_SHARED_SECRET: string;
    readonly VITE_MOP_VERSION: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "node-vibrant/dist/vibrant.worker.min.js"

declare module 'qs';