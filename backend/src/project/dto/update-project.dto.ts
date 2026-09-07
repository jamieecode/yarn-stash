import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

// Cloudinary 업로드 결과 - Yarn 사진과 동일한 형태 (기획서 2.8)
class ProjectPhotoInputDto {
  @IsString() url: string;
  @IsOptional() @IsString() publicId?: string;
}

// 완료 처리와 실사용량 확정을 한 번의 요청으로 묶기 위한 항목.
// 완료 모달에서 "이 실 몇 m 썼어요"를 받아 status와 함께 보내면 재고가 그 시점에 확정된다
class ConfirmYarnUsageDto {
  @IsString() yarnId: string;

  @IsNumber()
  @Min(0)
  usedM: number;

  @IsOptional()
  @IsIn(["METRIC", "IMPERIAL"])
  inputUnit?: "METRIC" | "IMPERIAL";
}

// 화면설계서 7-1(프로젝트 상세) - 상태·단수·메모·사진 부분 수정.
// 실 연결은 별도 엔드포인트(/projects/:id/yarns)로 분리됨 - 예약량까지 다뤄야 해서 단일 yarnId로는 표현이 안 됨
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectPhotoInputDto)
  photos?: ProjectPhotoInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmYarnUsageDto)
  confirmUsages?: ConfirmYarnUsageDto[];
}
