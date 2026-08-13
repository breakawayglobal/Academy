import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Onboarding.css';

export default function Onboarding() {
  const { user, loading, profile, profileLoading, refreshProfile, session } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading || profileLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName.trim(),
      date_of_birth: dateOfBirth,
      country: country.trim(),
      phone: phone.trim(),
      target_amount: Number(targetAmount),
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/generate-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: fullName.trim() }),
      });
      if (res.ok) {
        const { url } = await res.json();
        new Audio(url).play().catch(() => {});
      }
    } catch {
      // Voice greeting is a nice-to-have; profile is already saved either way.
    }

    await refreshProfile();
    setSubmitting(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="onboarding">
      <form className="onboarding__card" onSubmit={handleSubmit}>
        <p className="onboarding__eyebrow">One last step</p>
        <h1 className="onboarding__title">Tell us about you</h1>
        <p className="onboarding__hint">This personalizes your dashboard and welcome greeting.</p>

        <label className="onboarding__field">
          <span>Full name</span>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>

        <label className="onboarding__field">
          <span>Date of birth</span>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </label>

        <label className="onboarding__field">
          <span>Country</span>
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required />
        </label>

        <label className="onboarding__field">
          <span>Phone number</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>

        <label className="onboarding__field">
          <span>Trading profit goal over the next 90 days (USD)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </label>

        {error && <p className="onboarding__error">{error}</p>}

        <button type="submit" className="onboarding__submit" disabled={submitting}>
          {submitting ? 'Setting up your dashboard…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
