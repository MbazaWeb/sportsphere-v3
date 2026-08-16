import { redirect } from 'next/navigation';

/**
 * Root page — immediately bounce to /dashboard.
 * The proxy will redirect to /login if there's no admin session.
 */
export default function RootPage() {
  redirect('/dashboard');
}
