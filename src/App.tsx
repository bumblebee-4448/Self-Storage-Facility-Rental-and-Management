import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import { AuthSessionInitializer } from '@/components/providers/AuthSessionInitializer'

function App() {
  return (
    <AuthSessionInitializer>
      <RouterProvider router={router} />
    </AuthSessionInitializer>
  )
}

export default App
