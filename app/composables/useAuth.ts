export interface User {
    id: number
    email: string
    createdAt: string
}

export const useAuth = () => {
    const user = useState<User | null>('user', () => null)
    const loading = useState<boolean>('auth-loading', () => true)

    const fetchUser = async () => {
        loading.value = true
        try {
            const data = await $fetch<User>('/api/auth/me')
            user.value = data
        } catch (error) {
            user.value = null
        } finally {
            loading.value = false
        }
    }

    const login = async (credentials: { email: string; password: string }) => {
        try {
            const data = await $fetch<User>('/api/auth/login', {
                method: 'POST',
                body: credentials
            })
            user.value = data
            return { success: true }
        } catch (error: any) {
            return {
                success: false,
                error: error.data?.statusMessage || 'Une erreur est survenue lors de la connexion.'
            }
        }
    }

    const register = async (credentials: { email: string; password: string }) => {
        try {
            await $fetch('/api/auth/register', {
                method: 'POST',
                body: credentials
            })
            return await login(credentials)
        } catch (error: any) {
            return {
                success: false,
                error: error.data?.statusMessage || "Une erreur est survenue lors de l'inscription."
            }
        }
    }

    const logout = async () => {
        try {
            const { setCurrentAccountId } = useCurrentAccount()
            await $fetch('/api/auth/logout', { method: 'POST' })
            setCurrentAccountId(null)
            user.value = null
            navigateTo('/auth/login')
        } catch (error) {
            console.error('Logout failed', error)
        }
    }

    return {
        user,
        loading,
        fetchUser,
        login,
        register,
        logout,
        isAuthenticated: computed(() => !!user.value)
    }
}
