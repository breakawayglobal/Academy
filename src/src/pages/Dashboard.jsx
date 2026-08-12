import { Link } from 'react-router-dom';
import RadialLauncher from '../components/RadialLauncher';
import { topics } from '../data/topics';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Welcome back</p>
          <h1 className="dashboard__title">Your Learning Wheel</h1>
        </div>
        <p className="dashboard__hint">Select a topic on the wheel to begin, or jump straight in below.</p>
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
