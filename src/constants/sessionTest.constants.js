export const SESSION_STATUS = {
  STARTED: 'started',
  IN_PROGRESS: 'in-progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  TIMEOUT: 'timeout'
};

export const SESSION_TYPE = {
  FULL_TEST: 'full-test',
  PRACTICE: 'practice'
};

export const ACTIVE_SESSION_STATUSES = [
  SESSION_STATUS.STARTED,
  SESSION_STATUS.IN_PROGRESS,
  SESSION_STATUS.PAUSED
];

export const TOEIC_PARTS = {
  ALL: [1, 2, 3, 4, 5, 6, 7],
  LISTENING: [1, 2, 3, 4],
  READING: [5, 6, 7]
};