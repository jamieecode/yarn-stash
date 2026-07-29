import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class CreateBatchDto {
  @IsOptional()
  @IsString()
  dyeLot?: string;

  @IsInt()
  @Min(1)
  skeinCount: number;

  @IsNumber()
  weightPerSkeinG: number;

  @IsNumber()
  lengthPerSkeinM: number;

  @IsIn(["METRIC", "IMPERIAL"])
  inputUnit: "METRIC" | "IMPERIAL";

  @IsOptional()
  @IsString()
  purchasedAt?: string; // ISO 날짜 문자열, 선택 (화면설계서 2번 "구매일")
}

// Cloudinary 업로드 결과 - publicId는 삭제/변환 API 호출용으로 함께 저장 (기획서 2.8)
export class YarnPhotoInputDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  publicId?: string;
}

export class CreateYarnDto {
  @IsOptional() @IsString() catalogId?: string;

  @IsString() brand: string;
  @IsOptional() @IsString() lineName?: string;
  @IsOptional() @IsString() colorName?: string;
  @IsOptional() @IsString() fiber?: string;

  // 실은 무게 카테고리를 몰라도 등록 가능 (기획서 2.1) - 그래서 optional
  @IsOptional() @IsString() weightCategory?: string;
  @IsOptional() @IsString() needleSize?: string;
  @IsOptional() @IsNumber() gaugeStitches?: number;
  @IsOptional() @IsString() memo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YarnPhotoInputDto)
  photos?: YarnPhotoInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBatchDto)
  batches: CreateBatchDto[];
}
