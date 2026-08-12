const STORAGE_KEY = 'lms-progress-v1';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isLessonComplete(topicId, lessonIndex) {
  const all = readAll();
  return Boolean(all[topicId]?.[lessonIndex]);
}

export function toggleLesson(topicId, lessonIndex) {
  const all = readAll();
  if (!all[topicId]) all[topicId] = {};
  all[topicId][lessonIndex] = !all[topicId][lessonIndex];
  writeAll(all);
  return all[topicId][lessonIndex];
}

export function getTopicProgress(topicId, totalLessons) {
  if (!totalLessons) return 0;
  const all = readAll();
  const completed = Object.values(all[topicId] || {}).filter(Boolean).length;
  return completed / totalLessons;
}
