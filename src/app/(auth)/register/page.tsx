import AuthCardLayout from '@/components/auth/AuthCardLayout'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Create Account | Construction Management System',
}

export default function RegisterPage() {
  return (
    <AuthCardLayout
      title="Create an Account"
      subtitle="Join your construction team with Google or email"
    >
      <RegisterForm />
    </AuthCardLayout>
  )
}

