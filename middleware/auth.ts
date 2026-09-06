export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, initialized, fetchMe } = useAuth()

  if (!initialized.value) {
    await fetchMe()
  }

  if (!user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
