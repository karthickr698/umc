import type { UserDto } from '@umc/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware; read it with `getAuthUser(req)`. */
      user?: UserDto;
    }
  }
}

export {};
