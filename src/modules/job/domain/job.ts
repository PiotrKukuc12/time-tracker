import { DateUtil } from 'src/modules/utils';
import { JobId } from './value-objects/id/job-id.vo';
import { ProjectId } from './value-objects/id/project-id.vo';
import { ConflictException } from '@nestjs/common';
import { dbSchema } from 'src/modules/database';
import { JobStatus } from 'src/modules/database/schema/job/job.schema';
import { UserId } from 'src/modules/user';

export interface JobProps {
  id: JobId;
  userId: UserId;
  projectId: ProjectId;
  description: string;
  startDate: Date;
  finishDate: Date | null;
  status: JobStatus;
}

export interface JobReadModel {
  id: string;
  userId: string;
  projectId: string;
  description: string;
  startDate: Date;
  finishDate: Date | null;
  status: JobStatus;
}

export type JobInsertType = typeof dbSchema.jobs.$inferInsert;
export type JobSelectType = typeof dbSchema.jobs.$inferSelect;

export class Job implements JobProps {
  public readonly id: JobId;
  public readonly userId: UserId;
  public readonly projectId: ProjectId;
  public readonly description: string;
  public readonly startDate: Date;
  public finishDate: Date | null;
  public status: JobStatus;

  constructor(props: JobProps) {
    Object.assign(this, props);
  }

  public finish(): void {
    this.finishDate = DateUtil.now;
    this.status = JobStatus.FINISHED;
  }

  public static start(
    props: Omit<JobProps, 'id' | 'status' | 'finishDate' | 'startDate'>,
  ): Job {
    return new Job({
      ...props,
      id: JobId.generate(),
      status: JobStatus.ACTIVE,
      startDate: DateUtil.now,
      finishDate: null,
    });
  }

  public stop(): void {
    if (this.status === JobStatus.FINISHED) {
      throw new ConflictException('Job already finished');
    }
    this.finishDate = DateUtil.now;
    this.status = JobStatus.FINISHED;
  }

  public static toDomain(input: JobSelectType): Job {
    return new Job({
      id: new JobId(input.id),
      projectId: new ProjectId(input.projectId),
      userId: new UserId(input.userId),
      description: input.description,
      startDate: input.startDate,
      finishDate: input.finishDate,
      status: input.status,
    });
  }

  public toInsert(): JobInsertType {
    return {
      id: this.id.value,
      userId: this.userId.value,
      projectId: this.projectId.value,
      description: this.description,
      startDate: this.startDate,
      finishDate: this.finishDate,
      status: this.status,
    };
  }

  public toReadModel(): JobReadModel {
    return {
      id: this.id.value,
      userId: this.userId.value,
      projectId: this.projectId.value,
      description: this.description,
      startDate: this.startDate,
      finishDate: this.finishDate,
      status: this.status,
    };
  }
}
