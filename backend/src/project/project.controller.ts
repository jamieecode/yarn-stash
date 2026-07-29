import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

// 프로젝트는 실(Yarn)과 마찬가지로 완전히 개인 데이터라 전부 로그인(게스트 포함) 필요
@UseGuards(AuthGuard)
@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  findAll(
    @CurrentUser() user: { userId: string },
    @Query("status") status?: string,
    @Query("patternId") patternId?: string,
  ) {
    return this.projectService.findAll(user.userId, status, patternId);
  }

  @Get(":id")
  findOne(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.projectService.findOne(user.userId, id);
  }

  @Post()
  start(@CurrentUser() user: { userId: string }, @Body() body: { patternId: string; yarnId?: string }) {
    return this.projectService.startOrResume(user.userId, body.patternId, body.yarnId);
  }

  @Patch(":id")
  update(@CurrentUser() user: { userId: string }, @Param("id") id: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(user.userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.projectService.remove(user.userId, id);
  }
}
