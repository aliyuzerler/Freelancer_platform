import { z } from 'zod';

export const proposalMilestoneSchema = z.object({
  title: z.string().min(2).max(120),
  amount: z.number().int().positive(), // minor units
  dueInDays: z.number().int().positive().max(3650).optional(),
});

export const createProposalSchema = z.object({
  jobId: z.string().cuid(),
  coverLetter: z.string().min(40, 'A stronger cover letter improves your odds').max(10_000),
  bidAmount: z.number().int().positive(), // minor units
  bidType: z.enum(['HOURLY', 'FIXED']),
  estimatedDays: z.number().int().positive().max(3650).optional(),
  milestones: z.array(proposalMilestoneSchema).max(20).default([]),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
