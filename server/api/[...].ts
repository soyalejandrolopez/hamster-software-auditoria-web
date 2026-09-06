import { createHonoApp } from '../app'

const app = createHonoApp()

export default defineEventHandler(async (event) => {
  const req = toWebRequest(event)
  return app.fetch(req)
})
