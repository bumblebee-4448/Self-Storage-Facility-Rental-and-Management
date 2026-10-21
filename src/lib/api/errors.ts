import axios from 'axios'
import { z } from 'zod'
import type { ApiErrorResponse } from './types'

const apiErrorSchema = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  messageCode: z.string(),
  message: z.string(),
  errors: z.unknown().optional(),
  path: z.string(),
  timestamp: z.string(),
  stack: z.string().optional(),
})

export type NormalizedApiError =
  | {
      kind: 'http'
      status: number
      messageCode?: string
      message: string
      errors?: unknown
      response?: ApiErrorResponse
    }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'unexpected'; message: string }

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      kind: 'unexpected',
      message: error instanceof Error ? error.message : 'Unexpected error.',
    }
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return { kind: 'timeout', message: 'The request timed out.' }
  }

  if (error.response) {
    const parsed = apiErrorSchema.safeParse(error.response.data)
    if (parsed.success) {
      return {
        kind: 'http',
        status: error.response.status,
        messageCode: parsed.data.messageCode,
        message: parsed.data.message,
        errors: parsed.data.errors,
        response: parsed.data,
      }
    }
    return {
      kind: 'http',
      status: error.response.status,
      message: 'The server returned an unexpected response.',
    }
  }

  if (error.request) {
    return { kind: 'network', message: 'The server could not be reached.' }
  }

  return { kind: 'unexpected', message: error.message || 'Unexpected error.' }
}
