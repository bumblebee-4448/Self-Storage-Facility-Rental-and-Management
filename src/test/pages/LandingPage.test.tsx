import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/pages/LandingPage'

describe('LandingPage', () => {
  it('shows the storage introduction and discovery action', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /chỗ cho những điều/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /khám phá cơ sở/i }),
    ).toHaveAttribute('href', '/facilities')
  })
})
