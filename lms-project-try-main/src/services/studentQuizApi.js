import { apiFetch } from '../api/client';

export const studentQuizApi = {
  list: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.q) q.set('q', params.q);
    const qs = q.toString();
    const payload = await apiFetch(`/api/student/quizzes${qs ? `?${qs}` : ''}`);
    if (!payload?.success) throw new Error(payload?.message || 'Failed to load quizzes');
    return {
      data: payload.data ?? [],
      pagination: payload.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    };
  },

  getOverview: async (quizId) => {
    const payload = await apiFetch(`/api/student/quizzes/${quizId}/overview`);
    if (!payload?.success) throw new Error(payload?.message || 'Failed to load quiz');
    return payload.data;
  },

  startOrResumeAttempt: async (quizId) => {
    const payload = await apiFetch(`/api/student/quizzes/${quizId}/attempts`, { method: 'POST' });
    if (!payload?.success) throw new Error(payload?.message || 'Failed to start attempt');
    return payload.data;
  },

  getAttempt: async (attemptId) => {
    const payload = await apiFetch(`/api/student/quizzes/attempts/${attemptId}`);
    if (!payload?.success) throw new Error(payload?.message || 'Failed to load attempt');
    return payload.data;
  },

  patchAttempt: async (attemptId, body) => {
    const payload = await apiFetch(`/api/student/quizzes/attempts/${attemptId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!payload?.success) throw new Error(payload?.message || 'Failed to save');
    return payload.data;
  },

  submit: async (attemptId) => {
    const payload = await apiFetch(`/api/student/quizzes/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!payload?.success) throw new Error(payload?.message || 'Failed to submit');
    return payload.data;
  },

  abandonInProgress: async (quizId) => {
    const payload = await apiFetch(`/api/student/quizzes/${quizId}/abandon-in-progress`, {
      method: 'POST',
    });
    if (!payload?.success) throw new Error(payload?.message || 'Failed to reset attempt');
    return payload.data;
  },

  getResults: async (attemptId) => {
    const payload = await apiFetch(`/api/student/quizzes/attempts/${attemptId}/results`);
    if (!payload?.success) throw new Error(payload?.message || 'Failed to load results');
    return payload.data;
  },
};
