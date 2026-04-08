import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UsersService } from '../services/users.service';
import { ValidationException } from '@common/exceptions/app.exception';
import type { AuthenticatedRequest, ApiResponse } from '@common/types';
import type { UserResponseDto, GuestUserResponseDto } from '../dtos/user.dto';

const usersService = new UsersService();

// 사용자 정보 수정 검증 규칙
export const updateUserValidation = [
  body('displayName').optional().isString().trim(),
  body('phoneNumber').optional().isMobilePhone('en-US').trim(),
];

/**
 * 현재 사용자 정보 조회
 * GET /api/users/me
 * 인증 필수
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const result = await usersService.getMe(userId);

  const response: ApiResponse<UserResponseDto> = {
    success: true,
    message: '사용자 정보 조회 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};

/**
 * 사용자 정보 수정
 * PATCH /api/users/me
 * 인증 필수
 */
export const updateMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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

  const userId = req.user!.id;

  const result = await usersService.updateUser(userId, req.body);

  const response: ApiResponse<UserResponseDto> = {
    success: true,
    message: '사용자 정보 수정 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};

/**
 * 사용자 계정 삭제
 * DELETE /api/users/me
 * 인증 필수
 */
export const deleteMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user!.id;

  await usersService.deleteUser(userId);

  const response: ApiResponse = {
    success: true,
    message: '계정이 삭제되었습니다',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};

/**
 * 게스트 사용자 목록 조회 (3시간 이내 활동한 비회원)
 * GET /api/users/guest
 * 인증 필수
 */
export const getGuestUsers = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const result = await usersService.getGuestUsers();

  const response: ApiResponse<GuestUserResponseDto[]> = {
    success: true,
    message: '게스트 사용자 조회 성공',
    data: result,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};
