import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { OptionalAuthGuard } from "../common/guards/optional-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UpdateNicknameDto } from "./dto/update-nickname.dto";

// 화면설계서 0-1(시작 화면), 8(마이 탭)에서 호출하는 엔드포인트
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("guest")
  createGuest() {
    return this.authService.createGuest();
  }

  // 게스트로 쓰던 기기에서 로그인하는 경우, 기존 게스트 JWT가 있으면 OptionalAuthGuard가 심어준
  // user.userId를 게스트 병합 대상으로 함께 넘김 (기획서 2.9 "게스트 → 계정 전환 시 데이터 병합")
  @UseGuards(OptionalAuthGuard)
  @Post("kakao")
  loginWithKakao(@Body("code") code: string, @CurrentUser() user?: { userId: string }) {
    return this.authService.loginWithKakao(code, user?.userId);
  }

  @UseGuards(OptionalAuthGuard)
  @Post("google")
  loginWithGoogle(@Body("code") code: string, @CurrentUser() user?: { userId: string }) {
    return this.authService.loginWithGoogle(code, user?.userId);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.findById(user.userId);
  }

  // 마이페이지 닉네임 수정 (화면설계서 8번)
  @UseGuards(AuthGuard)
  @Patch("me")
  updateMe(@CurrentUser() user: { userId: string }, @Body() dto: UpdateNicknameDto) {
    return this.authService.updateNickname(user.userId, dto.nickname);
  }

  // JWT는 stateless라 서버 쪽 상태 변경은 없음 - 프론트가 localStorage 토큰을 지우는 트리거용 엔드포인트
  @Post("logout")
  logout() {
    return { success: true };
  }
}
