import { describe, expect, it } from 'vitest'
import type { ApiErrorResponse, ApiResponse } from './types'

interface ExamplePayload {
  id: string
  label: string
}

const successFixture: ApiResponse<ExamplePayload> = {
  success: true,
  statusCode: 200,
  messageCode: 'COMMON_SUCCESS',
  message: 'Request completed',
  data: { id: 'unit-1', label: 'Small unit' },
}

const errorFixture: ApiErrorResponse = {
  success: false,
  statusCode: 400,
  messageCode: 'VALIDATION_ERROR',
  message: 'Request validation failed',
  errors: [{ field: 'email', message: 'Email is invalid' }],
  path: '/api/example',
  timestamp: '2026-10-21T00:00:00.000Z',
}

describe('API response contracts', () => {
  it('supports the backend success envelope and typed business data', () => {
    expect(successFixture.success).toBe(true)
    expect(successFixture.statusCode).toBe(200)
    expect(successFixture.messageCode).toBe('COMMON_SUCCESS')
    expect(successFixture.data.id).toBe('unit-1')
  })

  it('supports the backend error envelope', () => {
    expect(errorFixture.success).toBe(false)
    expect(errorFixture.statusCode).toBe(400)
    expect(errorFixture.messageCode).toBe('VALIDATION_ERROR')
    expect(errorFixture.path).toBe('/api/example')
    expect(errorFixture.errors).toHaveLength(1)
  })
})
