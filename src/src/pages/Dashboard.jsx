import { Link } from 'react-router-dom';
import RadialLauncher from '../components/RadialLauncher';
import { topics } from '../data/topics';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import './Dashboard.css';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'back';

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <img src={logo} alt="" className="dashboard__logo" />
        <div>
          <p className="dashboard__eyebrow">Your Learning Wheel</p>
          <h1 className="dashboard__title">Welcome back, {firstName}</h1>
        </div>
        <p className="dashboard__hint">Select a topic on the wheel to begin, or jump straight in below.</p>
        <p className="dashboard__account">
          {user?.email}
          <button type="button" className="dashboard__signout" onClick={signOut}>
            Sign out
          </button>
        </p>
      </header>

      <RadialLauncher topics={topics} />

      <section className="dashboard__list">
        {topics.map((topic) => (
          <Link key={topic.id} to={`/topics/${topic.id}`} className="dashboard__list-item" style={{ '--accent': topic.color }}>
            <span className="dashboard__list-icon">{topic.icon}</span>
            <span className="dashboard__list-text">
              <span className="dashboard__list-name">{topic.name}</span>
              <span className="dashboard__list-tagline">{topic.tagline}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
