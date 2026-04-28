import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import { AuthContext } from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{ user: null, login: mockLogin }}>
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  it('renders the login form correctly', () => {
    renderComponent();
    expect(screen.getByText('Admin Login Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter administrator password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter Portal/i })).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Invalid credentials' }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('admin'), {
      target: { value: 'wrongadmin' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter administrator password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enter Portal/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid/i)).toBeInTheDocument();
    });
  });

  it('calls login and navigates on successful admin login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ user: { username: 'admin', role: 'admin' }, token: 'fake-token' }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('admin'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter administrator password'), {
      target: { value: 'adminpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enter Portal/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ user: { username: 'admin', role: 'admin' }, token: 'fake-token' });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/portal');
    });
  });
});
