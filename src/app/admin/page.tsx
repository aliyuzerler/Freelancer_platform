import { redirect } from 'next/navigation';

/** /admin has no page of its own — send admins to the review queue. */
export default function AdminIndexPage() {
  redirect('/admin/approvals');
}
