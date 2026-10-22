import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import { AuthSessionInitializer } from '@/components/providers/AuthSessionInitializer'
import { QueryProvider } from '@/components/providers/QueryProvider'

function App() {
  return (
    <QueryProvider>
      <AuthSessionInitializer>
        <RouterProvider router={router} />
      </AuthSessionInitializer>
    </QueryProvider>
  )
}

export default App
