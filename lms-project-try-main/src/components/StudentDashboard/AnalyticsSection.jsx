import { BarChart3, TrendingUp, Zap } from 'lucide-react'

export default function AnalyticsSection({ data }) {
  // Mock analytics data
  const weeklyData = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.2 },
    { day: 'Wed', hours: 1.8 },
    { day: 'Thu', hours: 4.1 },
    { day: 'Fri', hours: 3.7 },
    { day: 'Sat', hours: 2.3 },
    { day: 'Sun', hours: 1.9 },
  ]

  const lessonsData = [
    { name: 'Completed', value: 35, color: 'bg-emerald-500' },
    { name: 'In Progress', value: 12, color: 'bg-indigo-500' },
    { name: 'Not Started', value: 8, color: 'bg-slate-300' },
  ]

  const maxValue = Math.max(...weeklyData.map(d => d.hours))

  return (
    <div className="space-y-6">
      {false && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">Your Analytics</h3>
          <p className="text-sm text-slate-600">Track your learning progress</p>
        </div>
      )}

      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Learning Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900">Weekly Activity</h4>
              <BarChart3 size={20} className="text-indigo-600" />
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between space-x-2 h-40">
                {weeklyData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center space-y-2">
                    <div className="w-full flex items-end justify-center h-32 bg-slate-50 rounded-lg p-2">
                      <div
                        className="w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-700 hover:to-indigo-500 cursor-pointer"
                        style={{ height: `${(item.hours / maxValue) * 100}%` }}
                        title={`${item.hours}h`}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-600">Total: 19.5 hours</span>
                <span className="text-sm font-semibold text-emerald-600 flex items-center space-x-1">
                  <TrendingUp size={16} />
                  <span>+12% vs last week</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quiz Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900">Quiz Performance</h4>
              <Zap size={20} className="text-amber-600" />
            </div>

            <div className="space-y-4">
              {/* Donut Chart */}
              <div className="flex items-center justify-center py-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="8"
                    />
                    {/* Passed */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray="75 314"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">75%</span>
                    <span className="text-xs text-slate-500">Pass Rate</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Passed</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">6/8 quizzes</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Failed</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">2/8 quizzes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
          <h4 className="text-lg font-bold text-slate-900 mb-6">Lessons Status</h4>
          <div className="space-y-4">
            {lessonsData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 min-w-fit">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all`}
                    style={{ width: `${(item.value / 55) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-slate-900 min-w-fit">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
