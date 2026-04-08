// 회원가입 요청
export interface SignupRequestDto {
  email: string;
  password: string;
  passwordConfirm: string;
  displayName?: string;
}

// 로그인 요청
export interface LoginRequestDto {
  email: string;
  password: string;
}

// OAuth 로그인 요청
export interface OAuthLoginRequestDto {
  provider: 'google' | 'apple';
  token: string;
  email: string;
  displayName?: string;
}

// 게스트 로그인 요청 (본문 필요 없음)
export interface GuestLoginRequestDto {
  // 예약됨 - 나중의 추가 정보를 위해
}

// 인증 응답
export interface AuthResponseDto {
  id: string;
  email: string;
  displayName?: string;
  token: string;
  isGuest: boolean;
}
