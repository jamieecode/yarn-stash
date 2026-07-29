import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

// Cloudinary 업로드 결과 - Yarn 사진과 동일한 형태 (기획서 2.8)
class ProjectPhotoInputDto {
  @IsString() url: string;
  @IsOptional() @IsString() publicId?: string;
}

// 화면설계서 7-1(프로젝트 상세) - 상태·단수·메모·사진·실 연결을 부분 수정
export class UpdateProjectDto {
  @IsOptional()
  @IsIn(["IN_PROGRESS", "COMPLETED", "ON_HOLD"])
  status?: "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";

  @IsOptional()
  @IsInt()
  @Min(0)
  currentRow?: number;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  yarnId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectPhotoInputDto)
  photos?: ProjectPhotoInputDto[];
}
