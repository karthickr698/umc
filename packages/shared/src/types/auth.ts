import type { AUTH_HEADER_SCHEME } from '../constants/index.js';
import type { UserDto } from './domain.js';

export interface LoginRequest {
  email: string;
  password: string;
}

/** Self-service sign-up: creates a new company with the registering user as its OWNER. */
export interface RegisterRequest {
  companyName: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}

/** Returned by register, login and refresh; the refresh token travels only in an httpOnly cookie. */
export interface AuthTokens {
  accessToken: string;
  tokenType: typeof AUTH_HEADER_SCHEME;
  /** Access token lifetime in seconds. */
  expiresIn: number;
}

export interface AuthSession extends AuthTokens {
  user: UserDto;
}
