import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import QuotesClientPage from '@/components/quotes-client-page'

export default async function QuotesPage() {
  const session = await getServerSession(authOptions)
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/quotes`, {
    cache: 'no-store',
    headers: {
      cookie: session ? `next-auth.session-token=${session.user.id}` : '' // Simplified for demo
    }
  })
  const data = await response.json()

  return (
    <QuotesClientPage 
      initialData={data.success ? data.data : []} 
      initialStats={data.success ? data.pagination : null}
      initialStatusCounts={data.success ? data.statusCounts : {}}
    />
  )
}
