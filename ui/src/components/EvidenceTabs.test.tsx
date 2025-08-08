import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('Keyboard navigation', () => {
  it('tab key moves across controls and sections', async () => {
    const { getAllByRole, findAllByLabelText } = render(<App />)
    await userEvent.tab()
    expect(getAllByRole('link', { name: /safety/i })[0]).toHaveFocus()
    await userEvent.tab()
    expect((await findAllByLabelText(/url/i))[0]).toHaveFocus()
    await userEvent.tab()
    expect(getAllByRole('button', { name: /clear/i })[0]).toHaveFocus()
    await userEvent.tab()
    expect(getAllByRole('button', { name: /analyze/i })[0]).toHaveFocus()
  })
})