import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('Keyboard navigation', () => {
  it('tab from input moves to Analyze button', async () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    const input = screen.getAllByRole('textbox')[0]
    input.focus()
    expect(input).toHaveFocus()
    await userEvent.tab()
    expect(screen.getAllByRole('button', { name: /analyze/i })[0]).toHaveFocus()
  })
})