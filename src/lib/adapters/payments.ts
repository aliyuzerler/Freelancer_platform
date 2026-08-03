/**
 * Payments adapter interface — the architectural embodiment of "zero fees".
 *
 * Freelancezero never custodies money. An adapter's job is only to (a) initiate
 * a direct client -> freelancer transfer using the chosen provider and (b)
 * report status back so the ledger (Payment rows) stays accurate. The platform
 * takes NO cut at any layer; there is deliberately no "application fee" concept
 * anywhere in these interfaces.
 *
 * Self-hosters pick a driver via the PAYMENTS_DRIVER env var. The `manual`
 * driver assumes payment happens off-platform (bank transfer, invoice) and just
 * records it — the truly zero-dependency default.
 */
import type { PaymentProvider } from '@prisma/client';

export interface FundMilestoneParams {
  milestoneId: string;
  amount: number; // minor units
  currency: string;
  clientId: string;
  freelancerId: string;
}

export interface PaymentResult {
  provider: PaymentProvider;
  providerRef?: string;
  status: 'ESCROW_FUNDED' | 'RELEASED' | 'FAILED';
}

export interface PaymentsAdapter {
  readonly provider: PaymentProvider;
  /** Hold/fund a milestone (real escrow, provider escrow, or a recorded intent). */
  fundMilestone(params: FundMilestoneParams): Promise<PaymentResult>;
  /** Release held funds to the freelancer. */
  releaseMilestone(milestoneId: string): Promise<PaymentResult>;
  /** Refund a funded-but-unreleased milestone back to the client. */
  refundMilestone(milestoneId: string): Promise<PaymentResult>;
}

/**
 * Default, dependency-free adapter: records the payment as happening
 * off-platform. Real Stripe Connect / PayPal adapters implement the same shape.
 */
export const manualPaymentsAdapter: PaymentsAdapter = {
  provider: 'MANUAL',
  async fundMilestone() {
    return { provider: 'MANUAL', status: 'ESCROW_FUNDED' };
  },
  async releaseMilestone() {
    return { provider: 'MANUAL', status: 'RELEASED' };
  },
  async refundMilestone() {
    return { provider: 'MANUAL', status: 'FAILED' };
  },
};

/** Resolve the configured adapter. Extend the switch as adapters are added. */
export function getPaymentsAdapter(): PaymentsAdapter {
  switch (process.env.PAYMENTS_DRIVER) {
    // case 'stripe': return stripeConnectAdapter;
    // case 'paypal': return paypalAdapter;
    case 'manual':
    default:
      return manualPaymentsAdapter;
  }
}
