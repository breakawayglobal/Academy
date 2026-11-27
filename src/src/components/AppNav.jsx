import { NavLink } from 'react-router-dom';
import { BROKER_URL, BROKER_LABEL } from '../data/broker';
import './AppNav.css';

const LINKS = [
  { to: '/', label: 'Wheel', end: true },
  { to: '/journal', label: 'Journal' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/playbooks', label: 'Playbooks' },
  { to: '/assistant', label: 'Assistant' },
];

export default function AppNav() {
  return (
    <nav className="app-nav">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `app-nav__link${isActive ? ' is-active' : ''}`}
        >
          {link.label}
        </NavLink>
      ))}
      <a
        href={BROKER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="app-nav__link app-nav__link--external"
      >
        {BROKER_LABEL} ↗
      </a>
    </nav>
  );
}
