import { LoginForm } from '@/features/auth/components/login-form'
import { requireNoAuth } from '@/features/auth/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Login - Orchka",
  description: "Sign in to your Orchka account to access your workflows and automation tools.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LoginPage() {
  await requireNoAuth()
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
