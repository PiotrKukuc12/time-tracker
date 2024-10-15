import { INestApplication } from '@nestjs/common';
import { TestHelper } from '../support/test-helper';
import request from 'supertest';
import {
  Password,
  UserId,
  UserLoginResource,
  UserRegisterResource,
  VerifyUserResource,
} from 'src/modules/user';
import { faker } from '@faker-js/faker';
import { StartJobResource } from 'src/modules/user/domain/models/resource/job.resource';
import { dbSchema, DrizzleService } from 'src/modules/database';
import {
  UserRole,
  UserStatus,
} from 'src/modules/database/schema/user/user.schema';
import { CreateProjectResource } from 'src/modules/user/domain/models/resource/project.resource';
import { JobStatus } from 'src/modules/database/schema/job/job.schema';
import { ProjectId } from 'src/modules/job/domain/value-objects/id/project-id.vo';
import { JobId } from 'src/modules/job/domain/value-objects/id/job-id.vo';

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

describe('Jobs', () => {
  let app: INestApplication;
  let drizzle: DrizzleService;
  let adminUser;

  const sampleProjects: any[] = [];
  const sampleJobs: any[] = [];
  const sampleUsers: any[] = [];

  const numberOfUsers = 3; // Number of users to create
  const numberOfProjectsPerUser = 2; // Number of projects per user
  const numberOfJobsPerProject = 4; // Number of jobs per project

  beforeAll(async () => {
    const { application, drizzleService } = await TestHelper.prepareFixture();
    app = await application.init();

    drizzle = drizzleService;
    adminUser = {
      email: 'admin2@gmail.com',
      password: 'strongAdminPassword2',
    };

    const adminPassword = await Password.generateHashFrom(adminUser.password);

    // Create admin user
    await drizzle.db.insert(dbSchema.users).values({
      email: adminUser.email,
      password: adminPassword.value,
      roles: [UserRole.USER, UserRole.ADMIN],
      status: UserStatus.ACTIVE,
      verifyToken: null,
    });

    // Create sample users and projects with jobs
    for (let i = 0; i < numberOfUsers; i++) {
      const userEmail = faker.internet.email();
      const userPassword = faker.internet.password();
      const hashedPassword = await Password.generateHashFrom(userPassword);
      const userInsertId = UserId.generate();

      await drizzle.db.insert(dbSchema.users).values({
        id: userInsertId.value,
        email: userEmail,
        password: hashedPassword.value,
        roles: [UserRole.USER],
        status: UserStatus.ACTIVE,
        verifyToken: null,
      });

      sampleUsers.push({
        id: userInsertId.value,
        email: userEmail,
        password: userPassword,
      });

      for (let j = 0; j < numberOfProjectsPerUser; j++) {
        const projectName = `Project ${j + 1} for ${userEmail}`;
        const projectInsertId = ProjectId.generate();

        await drizzle.db.insert(dbSchema.projects).values({
          id: projectInsertId.value,
          name: projectName,
        });

        sampleProjects.push({
          id: projectInsertId.value,
          name: projectName,
          userId: userInsertId.value,
        });

        // Create jobs for each project
        for (let k = 0; k < numberOfJobsPerProject; k++) {
          const jobDescription = `Job ${k + 1} for ${projectName}`;
          const status = k % 2 === 0 ? JobStatus.ACTIVE : JobStatus.FINISHED; // Alternate statuses

          const jobInsertId = JobId.generate(); // Ensure this generates a unique ID
          const startDate = new Date(); // Current time as the start date
          const finishDate =
            status === JobStatus.FINISHED
              ? addHours(new Date(), 2) // Adding 2 hours if finished
              : null; // No finish date if still active

          await drizzle.db.insert(dbSchema.jobs).values({
            id: jobInsertId.value,
            description: jobDescription,
            userId: userInsertId.value,
            projectId: projectInsertId.value,
            status: status,
            startDate: startDate,
            finishDate: finishDate,
          });

          sampleJobs.push({
            id: jobInsertId.value,
            description: jobDescription,
            userId: userInsertId.value,
            projectId: projectInsertId.value,
            status,
            startDate,
            finishDate,
          });
        }
      }
    }
  });

  afterAll(async () => {
    await TestHelper.cleanDatabase();
  });

  describe('jobs', () => {
    let accessToken;
    let adminAccessToken;
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
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('roles');
        expect(body).toHaveProperty('accessToken');
      });

      it('shouldnt have access over admin role guard', async () => {
        const { status } = await request(app.getHttpServer())
          .get(`/auth/test-admin`)
          .set({
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens}`,
          });

        expect(status).toBe(403);
      });

      it('admin should have access to admin endpoints', async () => {
        const loginBody: UserLoginResource = {
          email: adminUser.email,
          password: adminUser.password,
        };

        const { body: adminBodyTokens } = await request(app.getHttpServer())
          .post(`/auth/token`)
          .send(loginBody)
          .set({
            accept: 'application/json',
            'Content-Type': 'application/json',
          });

        const { status } = await request(app.getHttpServer())
          .get(`/auth/test-admin`)
          .set({
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminBodyTokens.accessToken}`,
          });

        expect(status).toBe(200);
      });
    });

    it('should log in', async () => {
      const password = faker.internet.password();
      const registerBody: UserRegisterResource = {
        confirmPassword: password,
        password: password,
        email: faker.internet.email(),
      };

      const { body } = await request(app.getHttpServer())
        .post(`/auth/register`)
        .send(registerBody)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      const code = body.token;

      const verifyBody: VerifyUserResource = {
        code,
        email: registerBody.email,
      };
      await request(app.getHttpServer())
        .post(`/auth/verify`)
        .send(verifyBody)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });
      const { body: accessTokenBody } = await request(app.getHttpServer())
        .post(`/auth/token`)
        .send({
          email: registerBody.email,
          password: registerBody.password,
        })
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      const { body: adminAccessTokenBody } = await request(app.getHttpServer())
        .post(`/auth/token`)
        .send({
          email: adminUser.email,
          password: adminUser.password,
        })
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
        });

      accessToken = accessTokenBody.accessToken;
      adminAccessToken = adminAccessTokenBody.accessToken;
    });

    it('should create a new project', async () => {
      const createProjectBody: CreateProjectResource = {
        name: 'Test Project',
      };

      const { status } = await request(app.getHttpServer())
        .post(`/job/project`)
        .send(createProjectBody)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        });

      expect(status).toBe(201);
    });

    it('should create new job', async () => {
      const { body: projectList } = await request(app.getHttpServer())
        .get('/job/projects')
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      const firstProjectId = projectList.data[0].id;

      const createJobBody: StartJobResource = {
        description: 'Test description',
        projectId: firstProjectId,
      };

      const { status } = await request(app.getHttpServer())
        .post(`/job/start`)
        .send(createJobBody)
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(status).toBe(201);
    });

    let jobId;
    it('should have new job in jobs array', async () => {
      const { body: jobList } = await request(app.getHttpServer())
        .get('/job')
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      jobId = jobList.data[0].id;

      expect(jobList.data.length).toBeGreaterThan(0);
    });

    it('should finish job', async () => {
      const { status } = await request(app.getHttpServer())
        .patch(`/job/finish`)
        .send({
          jobId,
        })
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(status).toBe(200);
    });

    it('should have new job in jobs array', async () => {
      const { body: jobList } = await request(app.getHttpServer())
        .get('/job')
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(jobList.data.length).toBeGreaterThan(0);
      expect(jobList.data[0]).toHaveProperty('status');
    });

    it('should retrieve all jobs as admin', async () => {
      const { body: jobList } = await request(app.getHttpServer())
        .get('/job/admin')
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        });

      expect(jobList).toHaveProperty('data');
      expect(Array.isArray(jobList.data)).toBe(true);
      expect(jobList.data.length).toBeGreaterThan(0);

      jobList.data.forEach((job) => {
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('description');
        expect(job).toHaveProperty('status');
      });
    });

    it('should retrieve all jobs for the user', async () => {
      const { body: jobList } = await request(app.getHttpServer())
        .get('/job')
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(jobList).toHaveProperty('data');
      expect(Array.isArray(jobList.data)).toBe(true);
      expect(jobList.data.length).toBeGreaterThan(0);

      jobList.data.forEach((job) => {
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('description');
        expect(job).toHaveProperty('status');
      });
    });

    it('should retrieve total working time for the current user with pagination', async () => {
      const { body: workingTime } = await request(app.getHttpServer())
        .get('/job/working-time?page=1&limit=20') // First page, 7 days limit
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(Array.isArray(workingTime)).toBe(true);
      expect(workingTime.length).toBeLessThanOrEqual(20); // Ensure it doesn't exceed limit
      workingTime.forEach((entry) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('totalHours');
      });
    });

    it('should retrieve total working time for all users with pagination as admin', async () => {
      const { body: workingTime } = await request(app.getHttpServer())
        .get('/job/admin/working-time?page=1&limit=20') // First page, 7 days limit
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        });

      expect(Array.isArray(workingTime)).toBe(true);
      expect(workingTime.length).toBeLessThanOrEqual(7); // Ensure it doesn't exceed limit
      workingTime.forEach((entry) => {
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('totalHours');
      });
    });

    it('should return empty array when no jobs exist for current user', async () => {
      const { body: workingTime } = await request(app.getHttpServer())
        .get('/job/working-time?page=1&limit=20')
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(workingTime.length).toBe(1); // Expect no working time entries
    });

    it('should handle requests for non-existent pages gracefully', async () => {
      const { body: workingTime } = await request(app.getHttpServer())
        .get('/job/working-time?page=999&limit=20') // Arbitrary high page number
        .set({
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        });

      expect(workingTime.length).toBe(0); // Expect empty data on non-existent page
    });
  });
});
