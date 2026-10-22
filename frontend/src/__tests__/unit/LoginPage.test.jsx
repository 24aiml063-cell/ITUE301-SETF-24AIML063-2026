import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../pages/LoginPage';

describe('LoginPage', () => {
  it('renders an email input field', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeDefined();
    expect(emailInput.type).toBe('email');
  });

  it('renders a password input field', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeDefined();
    expect(passwordInput.type).toBe('password');
  });

  it('renders a submit button', () => {
    render(<LoginPage />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    expect(submitBtn).toBeDefined();
    expect(submitBtn.type).toBe('submit');
  });

  it('shows error message when form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitBtn);
    const error = screen.getByRole('alert');
    expect(error).toBeDefined();
    expect(error.textContent).toMatch(/required/i);
  });

  it('does not show error on initial render', () => {
    render(<LoginPage />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('has labels associated with inputs', () => {
    render(<LoginPage />);
    // getByLabelText throws if label is not associated — this verifies accessibility
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });
});
