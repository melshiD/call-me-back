import type { Env as GeneratedEnv } from './raindrop.gen';

declare module './raindrop.gen' {
  export interface Env extends GeneratedEnv {
    JWT_SECRET: string;
  }
}
