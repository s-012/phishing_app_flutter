import { Router } from 'express';
import { authMiddleware } from '@common/middleware/auth.middleware';

const router = Router();

// 모든 라우트에 인증 필수
router.use(authMiddleware);

/**
 * 스미싱 스캔
 * POST /api/scans/text
 * Body: { text }
 * TODO: 구현
 */
router.post('/text', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

/**
 * URL 스캔
 * POST /api/scans/uri
 * Body: { uri }
 * TODO: 구현
 */
router.post('/uri', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

/**
 * 사용자 스캔 기록 조회
 * GET /api/scans/me
 * TODO: 구현
 */
router.get('/me', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

export default router;
