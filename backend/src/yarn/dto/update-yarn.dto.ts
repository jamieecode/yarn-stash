import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from "class-validator";
import { IsPresent } from "../../common/validators/is-present.validator";
import { YarnPhotoInputDto } from "./create-yarn.dto";

// 마스터 정보 수정 (화면설계서 3-1) - catalogId는 최초 등록 시에만 연결, batches는 별도 엔드포인트로 관리
// 필드를 보내지 않으면(undefined) 변경 없음, 선택 항목에 null을 보내면 값을 비운다
export class UpdateYarnDto {
  @IsPresent() @IsString() @IsNotEmpty() brand?: string;
  @IsOptional() @IsString() lineName?: string | null;
  @IsOptional() @IsString() colorName?: string | null;
  @IsOptional() @IsString() fiber?: string | null;

  @IsOptional() @IsString() weightCategory?: string | null;
  @IsOptional() @IsString() needleSize?: string | null;
  @IsOptional() @IsNumber() @IsPositive() gaugeStitches?: number | null;
  @IsOptional() @IsString() memo?: string | null;

  @IsPresent()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YarnPhotoInputDto)
  photos?: YarnPhotoInputDto[];

  // "다 썼어요" 토글 (화면설계서 3번, 기획서 2.12)
  @IsPresent()
  @IsBoolean()
  consumed?: boolean;
}
