import { Router } from 'express';
import {
  getMe,
  updateMe,
  updateUserValidation,
  deleteMe,
  getGuestUsers,
} from '../controllers/users.controller';
import { authMiddleware } from '@common/middleware/auth.middleware';
import { asyncHandler } from '@common/utils/async-handler';

const router = Router();

// 모든 라우트에 인증 필수
router.use(authMiddleware);

/**
 * 게스트 사용자 목록 조회 (3시간 이내)
 * GET /api/users/guest
 */
router.get('/guest', asyncHandler(getGuestUsers));

/**
 * 현재 사용자 정보 조회
 * GET /api/users/me
 */
router.get('/me', asyncHandler(getMe));

/**
 * 사용자 정보 수정
 * PATCH /api/users/me
 * Body: { displayName?, phoneNumber? }
 */
router.patch('/me', updateUserValidation, asyncHandler(updateMe));

/**
 * 사용자 계정 삭제
 * DELETE /api/users/me
 */
router.delete('/me', asyncHandler(deleteMe));

export default router;
