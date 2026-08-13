import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import welcomeAudio from '../assets/welcome.mp3';
import logo from '../assets/logo.svg';
import './Login.css';

export default function Login() {
  const { user, profile, profileLoading, signIn, signUp } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    if (profileLoading) return null;
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={profile ? from : '/onboarding'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const { data, error: authError } =
      mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === 'sign-up') {
      setMessage('Check your email to confirm your account, then sign in.');
      setMode('sign-in');
      return;
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('full_name, welcome_audio_url')
      .eq('id', data.user.id)
      .maybeSingle();

    if (existingProfile?.welcome_audio_url) {
      new Audio(existingProfile.welcome_audio_url).play().catch(() => {});
    } else if (existingProfile) {
      new Audio(welcomeAudio).play().catch(() => {});
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <img src={logo} alt="" className="login__logo" />
        <p className="login__eyebrow">{mode === 'sign-in' ? 'Welcome back' : 'Get started'}</p>
        <h1 className="login__title">{mode === 'sign-in' ? 'Sign in' : 'Create your account'}</h1>

        <label className="login__field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="login__field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className="login__error">{error}</p>}
        {message && <p className="login__message">{message}</p>}

        <button type="submit" className="login__submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          className="login__switch"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setError('');
            setMessage('');
          }}
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
