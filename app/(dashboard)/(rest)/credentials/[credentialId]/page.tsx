import React from 'react'
import { requireAuth } from '@/lib/auth/utils'
interface CredentialPageProps {
    params: Promise<{
        credentialId: string
    }>
}
                
//http://localhost:3000/credentials/1

async function CredentialPage({ params }: CredentialPageProps) {
    const { credentialId } = await params
    await requireAuth()
  return (
    <div>CredentialPage {credentialId}</div>
  )
}

export default CredentialPage