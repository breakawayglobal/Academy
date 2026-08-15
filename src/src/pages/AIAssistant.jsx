import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppNav from '../components/AppNav';
import './AIAssistant.css';

export default function AIAssistant() {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/trade-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
      }
    } catch {
      setError('Could not reach the assistant.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-assistant">
      <AppNav />
      <header className="ai-assistant__header">
        <p className="ai-assistant__eyebrow">AI Assistant</p>
        <h1 className="ai-assistant__title">Ask about your trades</h1>
        <p className="ai-assistant__hint">
          Grounded in your own journal — try "What's my win rate on shorts?" or "Am I following my playbooks?"
        </p>
      </header>

      <div className="ai-assistant__thread">
        {messages.length === 0 && <p className="ai-assistant__empty">No messages yet — ask a question below.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`ai-assistant__bubble ai-assistant__bubble--${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="ai-assistant__bubble ai-assistant__bubble--assistant">Thinking…</div>}
      </div>

      {error && <p className="ai-assistant__error">{error}</p>}

      <form className="ai-assistant__form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your trading…"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
