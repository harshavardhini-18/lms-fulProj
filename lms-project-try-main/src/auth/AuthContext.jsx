import { createContext, useContext } from 'react'

const AuthContext = createContext({
  user: null,
  role: null,
  isLoading: true,
})

export function AuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

