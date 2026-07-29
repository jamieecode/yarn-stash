import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { YarnService } from "./yarn.service";
import { CreateBatchDto, CreateYarnDto } from "./dto/create-yarn.dto";
import { UpdateYarnDto } from "./dto/update-yarn.dto";
import { UpdateBatchDto } from "./dto/update-batch.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

// 실(Yarn)은 완전히 개인 데이터라 모든 엔드포인트에 로그인(게스트 포함) 필요 - 기획서 2.9
@UseGuards(AuthGuard)
@Controller("yarns")
export class YarnController {
  constructor(private readonly yarnService: YarnService) {}

  @Get()
  findAll(
    @CurrentUser() user: { userId: string },
    @Query("q") q?: string,
    @Query("weightCategory") weightCategory?: string,
    @Query("sort") sort?: string,
    @Query("includeConsumed") includeConsumed?: string,
  ) {
    return this.yarnService.findAll(user.userId, { q, weightCategory, sort, includeConsumed: includeConsumed === "true" });
  }

  @Get(":id")
  findOne(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.yarnService.findOne(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateYarnDto) {
    return this.yarnService.create(user.userId, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body() dto: UpdateYarnDto) {
    return this.yarnService.update(user.userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.yarnService.remove(user.userId, id);
  }

  @Get(":id/pattern-matches")
  findPatternMatches(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.yarnService.findPatternMatches(user.userId, id);
  }

  @Post(":id/batches")
  addBatch(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body() dto: CreateBatchDto) {
    return this.yarnService.addBatch(user.userId, id, dto);
  }

  @Patch(":id/batches/:batchId")
  updateBatch(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Param("batchId") batchId: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.yarnService.updateBatch(user.userId, id, batchId, dto);
  }

  @Delete(":id/batches/:batchId")
  removeBatch(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Param("batchId") batchId: string) {
    return this.yarnService.removeBatch(user.userId, id, batchId);
  }
}
