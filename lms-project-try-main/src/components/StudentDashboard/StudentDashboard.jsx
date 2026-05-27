import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AnalyticsCards from './AnalyticsCards'
import ContinueLearning from './ContinueLearning'
import AnalyticsSection from './AnalyticsSection'
import QuizPerformanceWidget from './QuizPerformanceWidget'
import LearningActivity from './LearningActivity'
import ActivityTimeline from './ActivityTimeline'
import ProgressTable from './ProgressTable'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userId = localStorage.getItem('lmsUserId')

      if (!userId) {
        navigate('/login')
        return
      }

      // Fetch student course progress
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const response = await fetch(
        `${API_BASE_URL}/api/student-course-progress/${userId}`,
        {
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err.message)
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            {/* Analytics Cards */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Welcome back!</h1>
              <AnalyticsCards data={dashboardData} />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Continue Learning */}
              <div className="lg:col-span-2 space-y-8">
                <ContinueLearning data={dashboardData} />
                <AnalyticsSection data={dashboardData} />
              </div>

              {/* Right Column - Sidebar Widgets */}
              <div className="space-y-8">
                <LearningActivity data={dashboardData} />
                <QuizPerformanceWidget data={dashboardData} />
                {/* <ActivityTimeline /> */}
              </div>
            </div>

            {/* Progress Table */}
            <ProgressTable data={dashboardData} />
          </div>
        </div>
      </main>
    </div>
  )
}
