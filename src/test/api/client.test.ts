import { describe, expect, it } from 'vitest'
import { appConfig } from '@/config/app'
import { apiClient } from '@/api/client'

describe('API client configuration', () => {
  it('sends credentialed requests', () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('uses the configured environment API base URL', () => {
    expect(appConfig.apiBaseUrl).toBe(import.meta.env.VITE_API_BASE_URL)
    expect(apiClient.defaults.baseURL).toBe(appConfig.apiBaseUrl)
  })
})
