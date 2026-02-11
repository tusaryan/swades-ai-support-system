import * as jose from 'jose';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function generateAccessToken(userId: string, email: string): Promise<string> {
  return await new jose.SignJWT({ userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .sign(ACCESS_SECRET);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return await new jose.SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, ACCESS_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, REFRESH_SECRET);
    return payload;
  } catch {
    return null;
  }
}

