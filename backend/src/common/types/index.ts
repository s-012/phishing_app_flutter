import { Request } from 'express';

// Express Request에 사용자 정보 추가
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isGuest: boolean;
  };
}

// 페이지네이션 쿼리
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// API 응답 표준 형식
export interface ApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
