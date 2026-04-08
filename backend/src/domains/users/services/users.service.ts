import { PrismaClient } from '@prisma/client';
import { NotFoundException } from '@common/exceptions/app.exception';
import type {
  UserResponseDto,
  UpdateUserRequestDto,
  GuestUserResponseDto,
} from '../dtos/user.dto';

const prisma = new PrismaClient();

export class UsersService {
  /**
   * 사용자 정보 조회 (/me)
   * 현재 인증된 사용자의 정보를 반환
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return this.toUserResponseDto(user);
  }

  /**
   * 사용자 정보 수정
   * displayName, phoneNumber를 수정할 수 있음
   */
  async updateUser(
    userId: string,
    dto: UpdateUserRequestDto
  ): Promise<UserResponseDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      },
    });

    return this.toUserResponseDto(updatedUser);
  }

  /**
   * 사용자 계정 삭제
   * 사용자와 관련된 모든 데이터를 삭제 (Cascade 설정)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * 게스트 사용자 목록 조회 (3시간 이내 활동한 사용자)
   * API 명세서: GET /api/users/guest
   * 로그인 사용자 중 비회원 사용 중 탐지한 중인 게스트 유저 조회
   */
  async getGuestUsers(): Promise<GuestUserResponseDto[]> {
    // 3시간 이내에 생성된 게스트 사용자 조회
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const guestUsers = await prisma.user.findMany({
      where: {
        isGuest: true,
        createdAt: {
          gte: threeHoursAgo,
        },
      },
      include: {
        scans: {
          select: {
            isPhishing: true,
          },
        },
      },
    });

    return guestUsers.map((user) => ({
      id: user.id,
      displayName: user.displayName ?? undefined,
      totalScans: user.scans.length,
      detectedPhishingCount: user.scans.filter((scan) => scan.isPhishing).length,
    }));
  }

  /**
   * UserResponseDto 변환 헬퍼
   */
  private toUserResponseDto(user: {
    id: string;
    email: string;
    displayName: string | null;
    phoneNumber: string | null;
    isGuest: boolean;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
