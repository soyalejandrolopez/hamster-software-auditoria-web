export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'client'
  createdAt: number
  updatedAt: number
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const loading = useState<boolean>('auth_loading', () => false)
  const initialized = useState<boolean>('auth_initialized', () => false)

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isClient = computed(() => user.value?.role === 'client')
  const isAuthenticated = computed(() => Boolean(user.value))

  const fetchMe = async () => {
    loading.value = true
    try {
      const fetch = useRequestFetch()
      const data = await fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const data = await $fetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = data.user
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.data?.error || err.message || 'Error al iniciar sesión' }
    } finally {
      loading.value = false
    }
  }

  const register = async (name: string, email: string, password: string) => {
    loading.value = true
    try {
      const data = await $fetch<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      })
      user.value = data.user
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.data?.error || err.message || 'Error al registrarse' }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      navigateTo('/login')
    } catch {
      user.value = null
      navigateTo('/login')
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    initialized,
    isAdmin,
    isClient,
    isAuthenticated,
    fetchMe,
    login,
    register,
    logout
  }
}
