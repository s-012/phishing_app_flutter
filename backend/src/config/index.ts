import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

export const config = {
  // 환경
  nodeEnv: process.env.NODE_ENV || 'development',

  // 서버
  port: parseInt(process.env.PORT || '3000', 10),

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '24h',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost',

  // Google Safe Browsing API
  googleSafeBrowsingApiKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY,

  // 데이터베이스 (Prisma가 DATABASE_URL 사용)
  databaseUrl: process.env.DATABASE_URL,
};

// 필수 환경 변수 검증
export const validateConfig = (): void => {
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = requiredVars.filter((variable) => !process.env[variable]);

  if (missing.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}`
    );
  }
};
