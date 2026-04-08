// 사용자 정보 조회 응답
export interface UserResponseDto {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  isGuest: boolean;
  createdAt: string;
}

// 사용자 정보 수정 요청
export interface UpdateUserRequestDto {
  displayName?: string;
  phoneNumber?: string;
}

// 게스트 사용자 조회 응답 (3시간 내 탐지)
export interface GuestUserResponseDto {
  id: string;
  displayName?: string;
  totalScans: number;
  detectedPhishingCount: number;
}
