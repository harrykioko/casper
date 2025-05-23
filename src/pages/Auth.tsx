
import { useTheme } from '@/hooks/use-theme';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function Auth() {
  const { theme } = useTheme();

  return <AuthLayout />;
}
