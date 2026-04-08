import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  ConflictException,
  UnauthorizedException,
} from '@common/exceptions/app.exception';
import { generateToken } from '@common/utils/jwt';
import type {
  SignupRequestDto,
  LoginRequestDto,
  OAuthLoginRequestDto,
  AuthResponseDto,
} from '../dtos/auth.dto';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * 회원가입
   * 이메일 중복 확인 후 비밀번호를 bcrypt로 암호화하여 사용자 생성
   */
  async signup(dto: SignupRequestDto): Promise<AuthResponseDto> {
    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다');
    }

    // 비밀번호 암호화 (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        displayName: dto.displayName,
        isGuest: false,
      },
    });

    // 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      isGuest: user.isGuest,
    });

    return this.toAuthResponseDto(user, token);
  }

  /**
   * 로그인
   * 이메일과 비밀번호를 검증하여 토큰 발급
   */
  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다'
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다'
      );
    }

    // 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      isGuest: user.isGuest,
    });

    return this.toAuthResponseDto(user, token);
  }

  /**
   * OAuth 로그인
   * OAuth 제공자(Google, Apple)를 통해 로그인하거나 가입
   */
  async oauthLogin(dto: OAuthLoginRequestDto): Promise<AuthResponseDto> {
    // TODO: OAuth 토큰 검증 (Google/Apple API 호출)
    // 이 부분은 실제로 Google/Apple API와 통신해야 함

    // 사용자 조회 또는 생성
    let user = await prisma.user.findFirst({
      where: {
        AND: [{ oauthProvider: dto.provider }, { oauthId: dto.token }],
      },
    });

    if (!user) {
      // 새 사용자 생성
      user = await prisma.user.create({
        data: {
          email: dto.email,
          displayName: dto.displayName,
          oauthProvider: dto.provider,
          oauthId: dto.token,
          oauthEmail: dto.email,
          isGuest: false,
        },
      });
    }

    // 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      isGuest: user.isGuest,
    });

    return this.toAuthResponseDto(user, token);
  }

  /**
   * 게스트 로그인
   * 비회원 사용자를 위한 게스트 토큰 발급
   */
  async guestLogin(): Promise<AuthResponseDto> {
    // 게스트 사용자 생성 (임시 UUID 이메일)
    const tempEmail = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@temp.local`;

    const user = await prisma.user.create({
      data: {
        email: tempEmail,
        isGuest: true,
      },
    });

    // 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      isGuest: user.isGuest,
    });

    return this.toAuthResponseDto(user, token);
  }

  /**
   * AuthResponseDto 변환 헬퍼
   * 사용자 정보를 API 응답 형식으로 변환
   */
  private toAuthResponseDto(
    user: { id: string; email: string; displayName: string | null; isGuest: boolean },
    token: string
  ): AuthResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? undefined,
      token,
      isGuest: user.isGuest,
    };
  }
}
