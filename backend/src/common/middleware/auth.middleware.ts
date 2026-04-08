import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../exceptions/app.exception';
import type { AuthenticatedRequest } from '../types';

// JWT 페이로드 인터페이스
export interface JwtPayload {
  id: string;
  email: string;
  isGuest: boolean;
  iat?: number;
  exp?: number;
}

// JWT 인증 미들웨어
export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('유효한 토큰이 필요합니다');
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET이 설정되지 않았습니다');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      isGuest: decoded.isGuest,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }
    throw error;
  }
};

// 게스트 사용자 제외 미들웨어
export const nonGuestMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.isGuest) {
    throw new UnauthorizedException('이 기능은 게스트 사용자는 사용할 수 없습니다');
  }
  next();
};
