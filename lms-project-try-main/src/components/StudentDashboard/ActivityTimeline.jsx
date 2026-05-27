import { CheckCircle2, HelpCircle, BookOpen, Award, Plus, Clock } from 'lucide-react'

export default function ActivityTimeline() {
  const activities = [
    {
      id: 1,
      type: 'completed',
      title: 'Completed Physics Lesson 4',
      timestamp: '2 hours ago',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 2,
      type: 'quiz',
      title: 'Passed Chemistry Quiz',
      timestamp: '5 hours ago',
      icon: HelpCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 3,
      type: 'enrolled',
      title: 'Continued Biology Course',
      timestamp: '1 day ago',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 4,
      type: 'achievement',
      title: 'Earned "Quick Learner" Badge',
      timestamp: '2 days ago',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      id: 5,
      type: 'enrolled',
      title: 'Joined Advanced Mathematics',
      timestamp: '3 days ago',
      icon: Plus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
        <p className="text-sm text-slate-500 mt-1">Your learning timeline</p>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex space-x-4">
              {/* Timeline Line & Icon */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center`}>
                  <Icon size={20} className={activity.color} />
                </div>
                {index !== activities.length - 1 && (
                  <div className="w-0.5 h-12 bg-slate-200 my-2"></div>
                )}
              </div>

              {/* Activity Content */}
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500">
                  <Clock size={12} />
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* View All Activity Button */}
      <button className="w-full mt-6 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all text-sm">
        View Full Timeline
      </button>
    </div>
  )
}
