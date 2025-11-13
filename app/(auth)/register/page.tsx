import { RegisterForm } from '@/features/auth/register-form'
import { requireNoAuth } from '@/lib/auth/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Register - Orchka",
  description: "Create your Orchka account to start building and automating workflows with AI.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function RegisterPage() {
  await requireNoAuth()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  )
}
