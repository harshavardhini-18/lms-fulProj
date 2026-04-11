import { apiFetch } from './client'

export async function listNotesByCourse(courseId) {
  const payload = await apiFetch(`/api/notes/course/${courseId}`)
  return payload?.data || []
}

export async function createNote(note) {
  const payload = await apiFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  })
  return payload?.data
}

export async function updateNote(noteId, patch) {
  const payload = await apiFetch(`/api/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  return payload?.data
}

export async function deleteNote(noteId) {
  await apiFetch(`/api/notes/${noteId}`, { method: 'DELETE' })
}

