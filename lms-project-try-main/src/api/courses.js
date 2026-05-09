import { apiFetch } from './client'

export async function listBackendCourses() {
  const payload = await apiFetch('/api/courses?includeAll=true')
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
  const match =
    backendCourses.find((c) => String(c?.slug || '') === frontendSlug) ||
    backendCourses.find((c) => {
      const backendSlug = String(c?.slug || '')
      return (
        (frontendSlug && backendSlug && frontendSlug.startsWith(backendSlug)) ||
        (frontendSlug && backendSlug && backendSlug.startsWith(frontendSlug))
      )
    })
  return match?._id || null
}

export async function getBackendCourseDetail(backendCourseId) {
  if (!backendCourseId) return null
  const payload = await apiFetch(`/api/courses/${backendCourseId}/detail`)
  return payload?.data || null
}

