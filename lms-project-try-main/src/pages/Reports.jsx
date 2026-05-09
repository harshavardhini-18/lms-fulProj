import { Navigate, useLocation } from 'react-router-dom'

/** Legacy route: lesson editing lives under Courses Management. */
export default function Reports() {
  const { pathname } = useLocation()
  const to = pathname.startsWith('/staff') ? '/staff/courses' : '/admin/courses'
  return <Navigate to={to} replace />
}
