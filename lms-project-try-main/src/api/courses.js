import { apiFetch } from './client'

export async function listBackendCourses() {
  const payload = await apiFetch('/api/courses')
  return payload?.data || []
}

function toSlug(text = '') {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function resolveBackendCourseId(frontendCourse) {
  const backendCourses = await listBackendCourses()
  const frontendSlug = toSlug(frontendCourse?.title || '')
  const match = backendCourses.find((c) => String(c?.slug || '') === frontendSlug)
  return match?._id || null
}

