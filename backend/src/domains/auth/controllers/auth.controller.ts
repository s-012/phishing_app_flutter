import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { ValidationException } from '@common/exceptions/app.exception';
import type { ApiResponse } from '@common/types';
import type { AuthResponseDto } from '../dtos/auth.dto';

const authService = new AuthService();

// 회원가입 검증 규칙
export const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일이 필요합니다'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 소문자, 대문자, 숫자를 포함해야 합니다'),
  body('passwordConfirm')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('비밀번호가 일치하지 않습니다'),
  body('displayName').optional().isString().trim(),
];

/**
 * 회원가입 핸들러
 * POST /api/auth/signup
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap = errors.mapped();
    const formattedErrors: Record<string, string[]> = {};
    for (const [field, error] of Object.entries(errorMap)) {
      formattedErrors[field] = [error.msg];
    }
    throw new ValidationException(formattedErrors);
  }

  const result = await authService.signup(req.body);

  const response: ApiResponse<AuthResponseDto> = {
    success: true,
    message: '회원가입 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
};

// 로그인 검증 규칙
export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('유효한 이메일이 필요합니다'),
  body('password').notEmpty().withMessage('비밀번호가 필요합니다'),
];

/**
 * 로그인 핸들러
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap = errors.mapped();
    const formattedErrors: Record<string, string[]> = {};
    for (const [field, error] of Object.entries(errorMap)) {
      formattedErrors[field] = [error.msg];
    }
    throw new ValidationException(formattedErrors);
  }

  const result = await authService.login(req.body);

  const response: ApiResponse<AuthResponseDto> = {
    success: true,
    message: '로그인 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};

// OAuth 로그인 검증 규칙
export const oauthLoginValidation = [
  body('provider')
    .isIn(['google', 'apple'])
    .withMessage("provider는 'google' 또는 'apple'이어야 합니다"),
  body('token').notEmpty().withMessage('토큰이 필요합니다'),
  body('email').isEmail().normalizeEmail().withMessage('유효한 이메일이 필요합니다'),
  body('displayName').optional().isString().trim(),
];

/**
 * OAuth 로그인 핸들러
 * POST /api/auth/oauth
 */
export const oauthLogin = async (req: Request, res: Response): Promise<void> => {
  // 입력 검증
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap = errors.mapped();
    const formattedErrors: Record<string, string[]> = {};
    for (const [field, error] of Object.entries(errorMap)) {
      formattedErrors[field] = [error.msg];
    }
    throw new ValidationException(formattedErrors);
  }

  const result = await authService.oauthLogin(req.body);

  const response: ApiResponse<AuthResponseDto> = {
    success: true,
    message: 'OAuth 로그인 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};

/**
 * 게스트 로그인 핸들러
 * POST /api/auth/guest
 */
export const guestLogin = async (_req: Request, res: Response): Promise<void> => {
  const result = await authService.guestLogin();

  const response: ApiResponse<AuthResponseDto> = {
    success: true,
    message: '게스트 로그인 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};
