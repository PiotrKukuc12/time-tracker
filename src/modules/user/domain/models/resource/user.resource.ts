import { z } from 'zod';

export const userRegisterSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });
    }
  });

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const verifyUserSchema = z.object({
  email: z.string().email(),
  code: z.string().uuid().min(1),
});

export const registerUserResponseSchema = z.object({
  token: z.string(),
});

export const loginUserResponseSchema = z.object({
  accessToken: z.string().min(1),
});

export type VerifyUserResource = z.infer<typeof verifyUserSchema>;
export type UserRegisterResource = z.infer<typeof userRegisterSchema>;
export type UserLoginResource = z.infer<typeof userLoginSchema>;
