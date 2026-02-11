import { db } from '../../lib/db.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { generateAccessToken } from '../../lib/jwt.js';

interface RegisterInput {
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  role?: 'user' | 'admin';
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  private passwordService = new PasswordService();
  private tokenService = new TokenService();

  async register(input: RegisterInput) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        passwordHash,
        phoneNumber: input.phoneNumber,
        role: input.role || 'user',
      })
      .returning();

    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await this.tokenService.createRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(input: LoginInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await this.passwordService.comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await this.tokenService.createRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const { userId, token } = await this.tokenService.rotateRefreshToken(refreshToken);

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = await generateAccessToken(user.id, user.email);

    return { accessToken, refreshToken: token };
  }

  async logout(refreshToken: string) {
    await this.tokenService.invalidateRefreshToken(refreshToken);
  }
}

