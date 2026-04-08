import { createApp } from './app';
import { config, validateConfig } from '@config/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startServer = async (): Promise<void> => {
  try {
    // 환경 변수 검증
    validateConfig();

    // 데이터베이스 연결 확인
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');

    // Express 앱 생성
    const app = createApp();

    // 서버 시작
    app.listen(config.port, () => {
      console.log(`🚀 서버가 포트 ${config.port}에서 실행 중입니다`);
      console.log(`📝 환경: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  서버 종료 중...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
