import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from '../routes/Home'

describe('Keyboard navigation', () => {
  it('tab from input moves to Analyze button', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    const input = screen.getAllByRole('textbox')[0]
    input.focus()
    expect(input).toHaveFocus()
    await userEvent.tab()
    expect(screen.getAllByRole('button', { name: /analyze/i })[0]).toHaveFocus()
  })
})