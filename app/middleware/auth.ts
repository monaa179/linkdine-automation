export default defineNuxtRouteMiddleware(async (to) => {
    const { user, fetchUser, loading } = useAuth()

    // Only fetch user if not already present and not in a loading state
    if (!user.value) {
        await fetchUser()
    }

    // If still not authenticated, redirect to login
    if (!user.value && to.path.startsWith('/dashboard')) {
        return navigateTo('/auth/login')
    }

    // If authenticated and trying to access auth pages, redirect to dashboard
    if (user.value && to.path.startsWith('/auth')) {
        return navigateTo('/dashboard/accounts')
    }
})
