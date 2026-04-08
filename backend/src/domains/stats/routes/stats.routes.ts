import { Router } from 'express';
import { authMiddleware } from '@common/middleware/auth.middleware';

const router = Router();

// 모든 라우트에 인증 필수
router.use(authMiddleware);

/**
 * 전체 뉴직 탐지 통계
 * GET /api/stats/dashboard
 * TODO: 구현
 */
router.get('/dashboard', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

/**
 * 위험 수준별 통계
 * GET /api/stats/risk-level
 * TODO: 구현
 */
router.get('/risk-level', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

export default router;
