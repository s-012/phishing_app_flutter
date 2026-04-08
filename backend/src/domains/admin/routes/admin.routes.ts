import { Router } from 'express';
import { authMiddleware } from '@common/middleware/auth.middleware';

const router = Router();

// 모든 라우트에 인증 필수
router.use(authMiddleware);

/**
 * 전체 사용자 목록 조회
 * GET /api/admin/users
 * TODO: 관리자 권한 검증 필요
 * TODO: 구현
 */
router.get('/users', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

/**
 * 전체 스미싱 탐지 로그 조회
 * GET /api/admin/logs
 * TODO: 관리자 권한 검증 필요
 * TODO: 구현
 */
router.get('/logs', (_req, res) => {
  res.status(501).json({
    success: false,
    message: '준비 중인 기능입니다',
    error: { code: 'NOT_IMPLEMENTED' },
  });
});

export default router;
