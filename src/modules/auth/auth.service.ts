import { from, map, Observable, switchMap, throwError } from 'rxjs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../user/domain/user';
import {
  AccessTokenPayload,
  AuthTokens,
  GenerateRefreshTokenInput,
} from './ts/types/auth.type';
import { UserService } from '../user/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { ApiConfigService } from '../config';
import {
  UserLoginResource,
  UserRegisterResource,
  VerifyUserResource,
} from '../user/domain/models/resource/user.resource';
import { DrizzleService } from '../database';
import { UserStatus } from '../database/schema/user/user.schema';
import { generateULID } from '../utils';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly env: ApiConfigService,
    private readonly drizzle: DrizzleService,
  ) {}

  public verifyUserCode({ code, email }: VerifyUserResource): Observable<void> {
    return from(
      this.userService.findOne({
        type: 'email',
        value: email,
        query: {
          status: UserStatus.INACTIVE,
        },
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => {
            throw new NotFoundException({
              message: 'User not found',
            });
          });
        }

        if (user.verifyToken !== code) {
          return throwError(() => {
            throw new NotFoundException({
              message: 'Invalid code',
            });
          });
        }

        user.update({
          status: UserStatus.ACTIVE,
          verifyToken: null,
        });

        return from(this.userService.update(user));
      }),
    );
  }

  private generateTokenPair({
    user,
  }: GenerateRefreshTokenInput): Observable<AuthTokens> {
    return this.generateAccessToken(user).pipe(
      map((token) => ({
        accessToken: token,
      })),
    );
  }

  public validateUser({
    email,
    password,
  }: UserLoginResource): Observable<AuthTokens> {
    return from(
      this.userService.findOne({
        type: 'email',
        value: email,
      }),
    ).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => {
            throw new NotFoundException({
              message: 'User not found',
            });
          });
        }

        if (user.status === UserStatus.INACTIVE) {
          return throwError(() => {
            throw new BadRequestException('User is not verified');
          });
        }

        const isMatch = user.password.compare(password);

        if (!isMatch) {
          return throwError(() => {
            throw new BadRequestException({
              message: 'Invalid credentials',
            });
          });
        }

        return this.generateTokenPair({ user });
      }),
    );
  }

  public register({
    email,
    password,
  }: UserRegisterResource): Observable<string> {
    return from(
      this.userService.findOne({
        type: 'email',
        value: email,
      }),
    ).pipe(
      switchMap((existingUser) => {
        if (existingUser) {
          return throwError(() => {
            throw new ConflictException({
              message: 'User already exists',
            });
          });
        }

        const token = generateULID();

        return from(
          User.connect({
            email,
            password,
            status: UserStatus.INACTIVE,
            verifyToken: token,
          }),
        ).pipe(
          switchMap((newUser) => {
            return from(this.userService.create(newUser)).pipe(
              map(() => {
                return token;
              }),
            );
          }),
        );
      }),
    );
  }

  private generateAccessToken(user: User): Observable<string> {
    const payload: AccessTokenPayload = {
      sub: user.id.value,
    };
    return from(
      this.jwtService.signAsync(payload, {
        secret: this.env.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
    );
  }
}
