// 애플리케이션 전역 예외 클래스
export class AppException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppException.prototype);
  }
}

// 인증 관련 예외
export class UnauthorizedException extends AppException {
  constructor(message: string = '인증이 필요합니다') {
    super(401, message, 'UNAUTHORIZED');
  }
}

// 권한 관련 예외
export class ForbiddenException extends AppException {
  constructor(message: string = '권한이 없습니다') {
    super(403, message, 'FORBIDDEN');
  }
}

// 리소스 못 찾음
export class NotFoundException extends AppException {
  constructor(message: string = '요청한 리소스를 찾을 수 없습니다') {
    super(404, message, 'NOT_FOUND');
  }
}

// 유효성 검사 예외
export class ValidationException extends AppException {
  constructor(
    public errors: Record<string, string[]>,
    message: string = '입력 데이터가 유효하지 않습니다'
  ) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

// 중복 관련 예외
export class ConflictException extends AppException {
  constructor(message: string = '이미 존재하는 리소스입니다') {
    super(409, message, 'CONFLICT');
  }
}

// 내부 서버 오류
export class InternalServerException extends AppException {
  constructor(message: string = '서버 내부 오류가 발생했습니다') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
  }
}
