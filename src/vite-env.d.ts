/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY?: string;
    NODE_ENV?: string;
    [key: string]: string | undefined;
  }
}
