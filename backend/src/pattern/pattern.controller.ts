import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PatternService } from "./pattern.service";
import { CreatePatternDto } from "./dto/create-pattern.dto";
import { UpdatePatternDto } from "./dto/update-pattern.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { OptionalAuthGuard } from "../common/guards/optional-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("patterns")
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  // 조회는 게스트도 가능 - OptionalAuthGuard (기획서 2.9)
  @UseGuards(OptionalAuthGuard)
  @Get()
  findAll(@Query("craftType") craftType?: string, @Query("weightCategory") weightCategory?: string, @Query("bookmarked") bookmarked?: string, @CurrentUser() user?: { userId: string }) {
    return this.patternService.findAll({ craftType, weightCategory, bookmarkedBy: bookmarked === "true" ? user?.userId : undefined });
  }

  @UseGuards(OptionalAuthGuard)
  @Get("search")
  search(@Query("q") q: string) {
    return this.patternService.search(q);
  }

  // Ravelry 검색 결과를 클릭했을 때 등록 폼을 자동으로 채우기 위한 상세 조회
  @UseGuards(OptionalAuthGuard)
  @Get("ravelry/:ravelryId")
  getRavelryDetail(@Param("ravelryId") ravelryId: string) {
    return this.patternService.getRavelryPatternDetail(Number(ravelryId));
  }

  @UseGuards(OptionalAuthGuard)
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user?: { userId: string }) {
    return this.patternService.findOne(id, user?.userId);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(":id/yarn-matches")
  findYarnMatches(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.patternService.findYarnMatches(user.userId, id);
  }

  // 삭제 가능 여부 판별용 (화면설계서 6번) - excludeSelf=true면 소유자 본인 찜은 제외하고 카운트
  @UseGuards(OptionalAuthGuard)
  @Get(":id/bookmark-count")
  bookmarkCount(
    @Param("id") id: string,
    @Query("excludeSelf") excludeSelf?: string,
    @CurrentUser() user?: { userId: string },
  ) {
    return this.patternService.getBookmarkCount(id, excludeSelf === "true" ? user?.userId : undefined);
  }

  @UseGuards(AuthGuard)
  @Get(":id/delete-check")
  deleteCheck(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.patternService.getDeleteEligibility(user.userId, id);
  }

  // 등록/수정/삭제/찜은 로그인(게스트 제외) 필요 - AuthGuard 통과 후 서비스에서 provider 체크
  @UseGuards(AuthGuard)
  @Post()
  create(@CurrentUser() user: { userId: string; provider: string }, @Body() dto: CreatePatternDto) {
    return this.patternService.create(user.userId, user.provider, dto);
  }

  @UseGuards(AuthGuard)
  @Patch(":id")
  update(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body() dto: UpdatePatternDto) {
    return this.patternService.update(user.userId, id, dto);
  }

  @UseGuards(AuthGuard)
  @Delete(":id")
  remove(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.patternService.remove(user.userId, id);
  }

  @UseGuards(AuthGuard)
  @Post(":id/bookmark")
  addBookmark(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.patternService.addBookmark(user.userId, id);
  }

  @UseGuards(AuthGuard)
  @Delete(":id/bookmark")
  removeBookmark(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.patternService.removeBookmark(user.userId, id);
  }

  // 화면설계서 6번 "내 메모" 저장
  @UseGuards(AuthGuard)
  @Patch(":id/bookmark")
  updateBookmarkMemo(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body("memo") memo?: string) {
    return this.patternService.updateBookmarkMemo(user.userId, id, memo ?? null);
  }
}
