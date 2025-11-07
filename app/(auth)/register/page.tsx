import { RegisterForm } from '@/features/auth/register-form'
import { requireNoAuth } from '@/lib/auth/utils'

export default async function RegisterPage() {
  await requireNoAuth()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  )
}
