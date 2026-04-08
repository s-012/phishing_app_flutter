import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../middleware/auth.middleware';

// JWT 토큰 생성
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '24h';

  if (!secret) {
    throw new Error('JWT_SECRET이 설정되지 않았습니다');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
};

// JWT 토큰 검증
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET이 설정되지 않았습니다');
  }

  return jwt.verify(token, secret) as JwtPayload;
};
