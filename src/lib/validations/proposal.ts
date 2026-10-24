import { z } from 'zod';
import { AMOUNT_MAX } from './job';

export const proposalMilestoneSchema = z.object({
  title: z.string().min(2, 'val.milestoneTitleMin').max(120, 'val.milestoneTitleMax'),
  amount: z.number().int().positive().max(AMOUNT_MAX), // minor units
  dueInDays: z.number().int().positive().max(3650).optional(),
});

export const createProposalSchema = z.object({
  jobId: z.string().cuid(),
  coverLetter: z.string().min(40, 'val.coverLetterMin').max(10_000),
  bidAmount: z.number().int().positive().max(AMOUNT_MAX), // minor units
  bidType: z.enum(['HOURLY', 'FIXED']),
  estimatedDays: z.number().int().positive().max(3650).optional(),
  milestones: z.array(proposalMilestoneSchema).max(20).default([]),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
