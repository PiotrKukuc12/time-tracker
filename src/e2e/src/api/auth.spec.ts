import { INestApplication } from '@nestjs/common';
import { TestHelper } from '../support/test-helper';

import request from 'supertest';
import { UserRegisterResource } from 'src/modules/user';
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

  describe('POST /register', () => {
    let testUser;
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
      const { body, status } = await request(app.getHttpServer())
        .get(`/auth/verify/${testUser.email}`)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      expect(status).toBe(200);
    });

    it('should login after verification', async () => {
      const { body, status } = await request(app.getHttpServer())
        .post(`/auth/token`)
        .send(testUser)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      expect(status).toBe(200);
    });
  });
});
