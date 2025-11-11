import React from 'react'

interface CredentialPageProps {
    params: Promise<{
        credentialId: string
    }>
}
                
//http://localhost:3000/credentials/1

async function CredentialPage({ params }: CredentialPageProps) {
    const { credentialId } = await params
  return (
    <div>CredentialPage {credentialId}</div>
  )
}

export default CredentialPage