import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = {
  title: 'Faculty Login',
};

export default function FacultyLoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center bg-slate-50 px-4 py-16">
      <LoginForm role="faculty" redirectTo="/dashboard/faculty" />
    </div>
  );
}
