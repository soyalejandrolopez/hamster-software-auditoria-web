import { createHonoApp } from '../app'

const app = createHonoApp()

export default defineEventHandler(async (event) => {
  try {
    const req = toWebRequest(event)
    return await app.fetch(req)
  } catch (err: any) {
    console.error('[API Server Error]:', err)
    return {
      error: true,
      statusCode: 500,
      message: err?.message || 'Error en el servidor API'
    }
  }
})
