import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { YarnCatalogService } from "./yarn-catalog.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("yarn-catalog")
export class YarnCatalogController {
  constructor(private readonly yarnCatalogService: YarnCatalogService) {}

  @Get("search")
  search(@Query("q") q: string) {
    return this.yarnCatalogService.search(q);
  }

  // Ravelry 검색 결과 중 클릭한 항목을 로컬 YarnCatalog로 확정(최초 캐싱은 게스트 불가, 조회는 항상 가능)
  @UseGuards(AuthGuard)
  @Post("ravelry/:ravelryId")
  resolveRavelry(@CurrentUser() user: { userId: string; provider: string }, @Param("ravelryId") ravelryId: string) {
    return this.yarnCatalogService.resolveRavelryYarn(user.userId, user.provider, Number(ravelryId));
  }
}
