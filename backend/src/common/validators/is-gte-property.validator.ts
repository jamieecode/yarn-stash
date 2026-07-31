import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

// 다른 숫자 필드보다 크거나 같은지 검증 (예: requiredMaxM >= requiredMinM). 값이 없으면 통과 - optional 필드는 @IsOptional로 별도 처리
export function IsGteProperty(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isGteProperty",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === undefined || value === null) return true;
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
          if (typeof value !== "number" || typeof relatedValue !== "number") return true;
          return value >= relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property}는 ${relatedPropertyName}보다 크거나 같아야 해요`;
        },
      },
    });
  };
}
