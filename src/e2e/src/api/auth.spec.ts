import { INestApplication } from '@nestjs/common';
import { TestHelper } from '../support/test-helper';

import request from 'supertest';
import { UserRegisterResource, VerifyUserResource } from 'src/modules/user';
import { faker } from '@faker-js/faker/.';

describe('User', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { application } = await TestHelper.prepareFixture();
    app = await application.init();
  });

  afterAll(async () => {
    await TestHelper.cleanDatabase();
  });

  describe('auth', () => {
    let testUser;
    let code;
    let tokens;
    it('should register new user', async () => {
      const password = faker.internet.password();
      const registerBody: UserRegisterResource = {
        confirmPassword: password,
        password: password,
        email: faker.internet.email(),
      };

      testUser = {
        password: registerBody.password,
        email: registerBody.email,
      };

      const { body, status } = await request(app.getHttpServer())
        .post(`/auth/register`)
        .send(registerBody)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      expect(status).toBe(201);
      expect(body).toHaveProperty('token');

      code = body.token;
    });

    it('should not access login for unverified user', async () => {
      const { body, status } = await request(app.getHttpServer())
        .post(`/auth/token`)
        .send(testUser)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      expect(status).toBe(400);
      expect(body.message).toBe('User is not verified');
    });

    it('should verify user', async () => {
      const verifyBody: VerifyUserResource = {
        code,
        email: testUser.email,
      };
      const { status } = await request(app.getHttpServer())
        .post(`/auth/verify`)
        .send(verifyBody)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      expect(status).toBe(201);
    });

    it('should login after verification', async () => {
      const { body, status } = await request(app.getHttpServer())
        .post(`/auth/token`)
        .send(testUser)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      expect(status).toBe(201);
      expect(body).toHaveProperty('accessToken');
      tokens = body.accessToken;
    });
    it('should have access over guard', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/auth/test-user`)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens}`,
        });

      expect(status).toBe(200);
      expect(body.res).toBe('access');
    });

    it('shouldnt have access over admin role guard', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/auth/test-admin`)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens}`,
        });

      expect(status).toBe(401);
    });
  });
});
