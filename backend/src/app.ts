import express, { Express } from 'express';
import cors from 'cors';

// 도메인 라우터
import authRoutes from '@domains/auth/routes/auth.routes';
import usersRoutes from '@domains/users/routes/users.routes';
import scansRoutes from '@domains/scans/routes/scans.routes';
import statsRoutes from '@domains/stats/routes/stats.routes';
import adminRoutes from '@domains/admin/routes/admin.routes';

// 미들웨어
import { errorHandler, notFoundHandler } from '@common/middleware/error.middleware';
import { config } from '@config/index';

export const createApp = (): Express => {
  const app = express();

  // 기본 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // 헬스 체크 (인증 불필요)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API 라우트
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/scans', scansRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 핸들러 (라우트 다음)
  app.use(notFoundHandler);

  // 에러 핸들러 (가장 마지막)
  app.use(errorHandler);

  return app;
};
