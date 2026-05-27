import { useState } from 'react'

// Toggle to hide the "Your Courses" table without deleting code
const HIDE_YOUR_COURSES = true
import { Eye, MoreVertical, ArrowRight, BookOpen, CheckCircle, TrendingUp } from 'lucide-react'

const courses = [
  { id: 1, name: 'Strings and String Handling', status: 'in_progress', lp: 8, lt: 12, qp: 2, qt: 3, pct: 65, last: '2 hours ago', enrolled: 'Jan 15, 2026' },
  { id: 2, name: 'Object-Oriented Programming', status: 'in_progress', lp: 6, lt: 15, qp: 1, qt: 4, pct: 45, last: '5 hours ago', enrolled: 'Feb 20, 2026' },
  { id: 3, name: 'Data Structures Mastery', status: 'completed', lp: 20, lt: 20, qp: 5, qt: 5, pct: 100, last: '3 days ago', enrolled: 'Nov 10, 2025' },
  { id: 4, name: 'Web Development Basics', status: 'in_progress', lp: 12, lt: 18, qp: 3, qt: 4, pct: 72, last: '1 hour ago', enrolled: 'Mar 5, 2026' },
  { id: 5, name: 'Advanced JavaScript', status: 'not_started', lp: 0, lt: 22, qp: 0, qt: 5, pct: 0, last: 'Never', enrolled: 'May 1, 2026' },
]

function Badge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    in_progress: 'bg-blue-50 text-blue-800 border border-blue-200',
    not_started: 'bg-slate-100 text-slate-600 border border-slate-200',
  }
  const labels = {
    completed: 'Completed',
    in_progress: 'In Progress',
    not_started: 'Not Started',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function ProgressBar({ pct }) {
  const fillColor =
    pct === 100 ? 'bg-emerald-500' :
    pct >= 50   ? 'bg-blue-500' :
    pct > 0     ? 'bg-slate-400' : 'bg-slate-200'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-[72px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-500">{pct}%</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-xl font-semibold text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

export default function CourseProgressTable() {
  if (HIDE_YOUR_COURSES) return null
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? courses : courses.filter(c => c.status === filter)

  const completedCount = courses.filter(c => c.status === 'completed').length
  const avgPct = Math.round(courses.reduce((sum, c) => sum + c.pct, 0) / courses.length)

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Your Courses</h2>
              <p className="text-xs text-slate-400 mt-0.5">Detailed progress overview</p>
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === f.key
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <StatCard icon={BookOpen} label="Total courses" value={courses.length} sub="12 enrolled overall" color="blue" />
            <StatCard icon={CheckCircle} label="Completed" value={completedCount} sub={`${Math.round((completedCount / courses.length) * 100)}% completion rate`} color="emerald" />
            <StatCard icon={TrendingUp} label="Avg. progress" value={`${avgPct}%`} sub="Across active courses" color="violet" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Course Name', 'Status', 'Lessons', 'Quizzes', 'Completion', 'Last Activity'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap ${
                        i >= 2 && i <= 4 ? 'text-center' : i === 6 ? 'text-center' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      idx === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    {/* Course Name */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{row.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Enrolled {row.enrolled}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge status={row.status} />
                    </td>

                    {/* Lessons */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-800">
                        {row.lp}<span className="text-slate-300 font-normal">/{row.lt}</span>
                      </span>
                    </td>

                    {/* Quizzes */}
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-800">
                        {row.qp}<span className="text-slate-300 font-normal">/{row.qt}</span>
                      </span>
                    </td>

                    {/* Completion */}
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <ProgressBar pct={row.pct} />
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-500">{row.last}</span>
                    </td>

                    {/* Actions */}
                    {/* <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all">
                          <Eye size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all">
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
              <span className="font-semibold text-slate-600">12</span> courses
            </p>
            <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
              View all courses <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
