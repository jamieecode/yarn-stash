import { IsNotEmpty, IsOptional, IsString } from "class-validator";

// 화면설계서 6-2(프로젝트 시작) - 도안 없이는 프로젝트를 시작할 수 없음
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  patternId: string;

  @IsOptional()
  @IsString()
  yarnId?: string;
}
