/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_API_KEY?: string
  readonly VITE_SERVER_URL?: string
  readonly VITE_SERVER_TOKEN?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_DEPLOY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
