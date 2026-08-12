import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getTopicById, topics } from '../data/topics';
import { isLessonComplete, toggleLesson, getTopicProgress } from '../utils/progress';
import './TopicPage.css';

export default function TopicPage() {
  const { topicId } = useParams();
  const topic = getTopicById(topicId);
  const [, forceRender] = useState(0);

  if (!topic) return <Navigate to="/" replace />;

  const progress = getTopicProgress(topic.id, topic.videos.length);
  const progressPct = Math.round(progress * 100);
  const index = topics.findIndex((t) => t.id === topic.id);
  const prev = topics[(index - 1 + topics.length) % topics.length];
  const next = topics[(index + 1) % topics.length];

  const handleToggle = (videoIndex) => {
    toggleLesson(topic.id, videoIndex);
    forceRender((n) => n + 1);
  };

  return (
    <div className="topic-page" style={{ '--accent': topic.color }}>
      <Link to="/" className="topic-page__back">
        ← Back to wheel
      </Link>

      <header className="topic-page__header">
        <span className="topic-page__icon">{topic.icon}</span>
        <div>
          <p className="topic-page__eyebrow">Topic {topic.number} of {topics.length}</p>
          <h1 className="topic-page__title">{topic.name}</h1>
          <p className="topic-page__tagline">{topic.tagline}</p>
        </div>
      </header>

      <p className="topic-page__description">{topic.description}</p>

      <div className="topic-page__progress">
        <div className="topic-page__progress-bar">
          <div className="topic-page__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="topic-page__progress-label">{progressPct}% complete</span>
      </div>

      <section className="topic-page__section">
        <h2 className="topic-page__section-title">Classes</h2>
        <ul className="topic-page__videos">
          {topic.videos.map((video, i) => {
            const watched = isLessonComplete(topic.id, i);
            return (
              <li key={video.title} className={`topic-page__video ${watched ? 'is-complete' : ''}`}>
                <div className="topic-page__video-frame">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                    title={`${topic.name} — ${video.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="topic-page__video-footer">
                  <span className="topic-page__video-title">{video.title}</span>
                  <button
                    type="button"
                    className="topic-page__watched-btn"
                    onClick={() => handleToggle(i)}
                  >
                    {watched ? '✓ Watched' : 'Mark as watched'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="topic-page__section">
        <h2 className="topic-page__section-title">What you'll cover</h2>
        <ul className="topic-page__lessons">
          {topic.lessons.map((lesson) => (
            <li key={lesson.title} className="topic-page__lesson">
              <div className="topic-page__lesson-text">
                <span className="topic-page__lesson-title">{lesson.title}</span>
                <span className="topic-page__lesson-description">{lesson.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <nav className="topic-page__nav">
        <Link to={`/topics/${prev.id}`} className="topic-page__nav-link">
          ← {prev.name}
        </Link>
        <Link to={`/topics/${next.id}`} className="topic-page__nav-link">
          {next.name} →
        </Link>
      </nav>
    </div>
  );
}
