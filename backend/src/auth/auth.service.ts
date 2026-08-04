import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthProvider } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // 게스트로 시작하기: 익명 User를 만들고 JWT 발급.
  async createGuest() {
    const user = await this.prisma.user.create({
      data: { provider: AuthProvider.GUEST, providerId: null },
    });
    return this.issueToken(user.id, user.provider);
  }

  // 카카오 OAuth: 인가 코드 → 토큰 교환(kauth) → 사용자 정보 조회(kapi) → find-or-create → 게스트 병합 → JWT 발급
  // https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
  async loginWithKakao(authorizationCode: string, guestUserId?: string) {
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.get<string>("KAKAO_CLIENT_ID") ?? "",
        client_secret: this.config.get<string>("KAKAO_CLIENT_SECRET") ?? "",
        redirect_uri: this.config.get<string>("KAKAO_REDIRECT_URI") ?? "",
        code: authorizationCode,
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException("카카오 인증에 실패했어요");
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) {
      throw new UnauthorizedException("카카오 사용자 정보를 가져오지 못했어요");
    }
    // 카카오는 이메일 제공 동의를 안 받을 수 있어(기획서 2.9), 최상위 id(고유 회원번호)만 providerId로 사용
    // 닉네임은 "선택 동의" 항목이라 사용자가 거부하면 응답에서 빠질 수 있음 - 그 경우 undefined로 가입 처리
    const profile = (await profileRes.json()) as {
      id: number;
      kakao_account?: { profile?: { nickname?: string } };
    };

    return this.findOrCreateSocialUser(
      AuthProvider.KAKAO,
      String(profile.id),
      guestUserId,
      profile.kakao_account?.profile?.nickname,
    );
  }

  // 구글 OAuth: 인가 코드 → 토큰 교환 → userinfo 조회(sub = 고유 ID) → find-or-create → 게스트 병합 → JWT 발급
  // https://developers.google.com/identity/protocols/oauth2/web-server
  async loginWithGoogle(authorizationCode: string, guestUserId?: string) {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.get<string>("GOOGLE_CLIENT_ID") ?? "",
        client_secret: this.config.get<string>("GOOGLE_CLIENT_SECRET") ?? "",
        redirect_uri: this.config.get<string>("GOOGLE_REDIRECT_URI") ?? "",
        code: authorizationCode,
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException("구글 인증에 실패했어요");
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) {
      throw new UnauthorizedException("구글 사용자 정보를 가져오지 못했어요");
    }
    const profile = (await profileRes.json()) as { sub: string; name?: string };

    return this.findOrCreateSocialUser(AuthProvider.GOOGLE, profile.sub, guestUserId, profile.name);
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // 마이페이지에서 닉네임 직접 수정 (기본값은 카카오/구글 가입 시 받아온 값, 이후엔 사용자가 자유롭게 변경)
  async updateNickname(userId: string, nickname: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { nickname } });
  }

  // provider+providerId 기준 find-or-create 후, 기존 게스트 세션이 있었다면 데이터 병합까지 처리
  private async findOrCreateSocialUser(
    provider: AuthProvider,
    providerId: string,
    guestUserId?: string,
    nickname?: string,
  ) {
    let user = await this.prisma.user.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });

    if (!user) {
      user = await this.prisma.user.create({ data: { provider, providerId, nickname } });
    }

    if (guestUserId && guestUserId !== user.id) {
      const guest = await this.prisma.user.findUnique({ where: { id: guestUserId } });
      if (guest?.provider === AuthProvider.GUEST) {
        await this.mergeGuestInto(guestUserId, user.id);
      }
    }

    return this.issueToken(user.id, user.provider);
  }

  // 게스트 → 정식 계정 전환 시, 게스트가 소유했던 Yarn/PatternBookmark/Project의 userId를
  // 새 계정으로 일괄 재할당 (기획서 2.9). 로그인 성공 흐름에서만 호출됨.
  async mergeGuestInto(guestUserId: string, targetUserId: string) {
    await this.prisma.$transaction([
      this.prisma.yarn.updateMany({ where: { userId: guestUserId }, data: { userId: targetUserId } }),
      this.prisma.patternBookmark.updateMany({ where: { userId: guestUserId }, data: { userId: targetUserId } }),
      this.prisma.project.updateMany({ where: { userId: guestUserId }, data: { userId: targetUserId } }),
    ]);
  }

  private issueToken(userId: string, provider: AuthProvider) {
    const payload = { userId, provider };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: userId, provider },
    };
  }
}
