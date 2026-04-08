import { Request, Response, NextFunction } from 'express';

// 비동기 라우트 핸들러의 에러를 catch하는 래퍼
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
