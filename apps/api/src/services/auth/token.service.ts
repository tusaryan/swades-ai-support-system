import { add } from 'date-fns';
import { db } from '../../lib/db.js';
import { refreshTokens } from '../../db/schema.js';
import { generateRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export class TokenService {
  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createRefreshToken(userId: string, ttlDays = 7) {
    const token = await generateRefreshToken(userId);
    const tokenHash = this.hashToken(token);
    const expiresAt = add(new Date(), { days: ttlDays });

    await db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    return token;
  }

  async rotateRefreshToken(oldToken: string) {
    const payload = await verifyRefreshToken(oldToken);
    if (!payload || typeof payload.userId !== 'string') {
      throw new Error('Invalid refresh token');
    }

    const oldHash = this.hashToken(oldToken);
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, oldHash));

    const newToken = await this.createRefreshToken(payload.userId);
    return { userId: payload.userId, token: newToken };
  }

  async invalidateRefreshToken(token: string) {
    const hash = this.hashToken(token);
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hash));
  }
}

