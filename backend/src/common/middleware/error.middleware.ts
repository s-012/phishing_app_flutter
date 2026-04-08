import { Request, Response, NextFunction } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ApiResponse } from '../types';

// 에러 처리 미들웨어 (모든 비동기 에러를 잡음)
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = '서버 내부 오류가 발생했습니다';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: Record<string, string[]> | undefined;

  if (err instanceof AppException) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'ERROR';
    
    // ValidationException에서 errors를 가져옴
    if ('errors' in err && err.errors) {
      details = err.errors as Record<string, string[]>;
    }
  }

  const error: { code: string; details?: Record<string, string[]> } = { code };
  if (details) {
    error.details = details;
  }

  const response: ApiResponse = {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

// 404 핸들러 (경로 못 찾음)
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: '요청한 경로를 찾을 수 없습니다',
    error: {
      code: 'NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
  } as ApiResponse);
};
