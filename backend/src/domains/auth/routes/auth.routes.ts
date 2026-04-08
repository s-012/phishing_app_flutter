import { Router } from 'express';
import {
  signup,
  signupValidation,
  login,
  loginValidation,
  oauthLogin,
  oauthLoginValidation,
  guestLogin,
} from '../controllers/auth.controller';
import { asyncHandler } from '@common/utils/async-handler';

const router = Router();

/**
 * 회원가입
 * POST /api/auth/signup
 * Body: { email, password, passwordConfirm, displayName? }
 */
router.post('/signup', signupValidation, asyncHandler(signup));

/**
 * 로그인 (이메일/비밀번호)
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', loginValidation, asyncHandler(login));

/**
 * OAuth 로그인
 * POST /api/auth/oauth
 * Body: { provider, token, email, displayName? }
 */
router.post('/oauth', oauthLoginValidation, asyncHandler(oauthLogin));

/**
 * 게스트 로그인
 * POST /api/auth/guest
 */
router.post('/guest', asyncHandler(guestLogin));

export default router;
