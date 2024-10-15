import { createZodDto } from '@anatine/zod-nestjs';
import {
  userLoginSchema,
  userRegisterSchema,
  verifyUserSchema,
} from 'src/modules/user/domain/models/resource/user.resource';

export class RegisterUserDto extends createZodDto(userRegisterSchema) {}

export class LoginUserDto extends createZodDto(userLoginSchema) {}

export class VerifyUserDto extends createZodDto(verifyUserSchema) {}
