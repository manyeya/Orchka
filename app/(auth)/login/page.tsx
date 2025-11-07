import { LoginForm } from '@/features/auth/login-form'
import { requireNoAuth } from '@/lib/auth/utils'

export default async function LoginPage() {
  await requireNoAuth()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
