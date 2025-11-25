import React, { useState, useEffect } from 'react'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  ClipboardList,
  Award,
  BarChart3,
  Building,
  GitBranch
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalMajors: 0,
    totalCohorts: 0,
    totalKnowledgeBlocks: 0,
    totalPositions: 0,
    activeEmployees: 0,
    activeCohorts: 0,
    completedCohorts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      toast.error('Không thể tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Tổng nhân viên',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      subtitle: `${stats.activeEmployees} đang hoạt động`
    },
    {
      title: 'Tổng ngành học',
      value: stats.totalMajors,
      icon: GraduationCap,
      color: 'bg-green-500',
      subtitle: 'Các chương trình đào tạo'
    },
    {
      title: 'Tổng khóa học',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-purple-500',
      subtitle: 'Học phần và môn học'
    },
    {
      title: 'Lớp học',
      value: stats.totalCohorts,
      icon: Calendar,
      color: 'bg-orange-500',
      subtitle: `${stats.activeCohorts} đang diễn ra`
    }
  ]

  const functionalModules = [
    {
      title: 'Quản lý chương trình đào tạo',
      icon: '🎯',
      color: 'border-blue-500',
      description: 'Tạo, chỉnh sửa và quản lý chương trình đào tạo',
      bgColor: 'bg-blue-50',
      route: '/programs'
    },
    {
      title: 'Quản lý học phần',
      icon: '📚',
      color: 'border-green-500',
      description: 'Quản lý danh mục học phần và nội dung giảng dạy',
      bgColor: 'bg-green-50',
      route: '/subjects'
    },
    {
      title: 'Duyệt đăng ký học',
      icon: '✅',
      color: 'border-orange-500',
      description: 'Xét duyệt đơn đăng ký học và chuyển ngành',
      bgColor: 'bg-orange-50',
      route: '/approvals'
    },
    {
      title: 'Báo cáo học tập',
      icon: '📊',
      color: 'border-purple-500',
      description: 'Thống kê và báo cáo kết quả học tập',
      bgColor: 'bg-purple-50',
      route: '/reports'
    },
    {
      title: 'Quản lý lịch thi',
      icon: '📅',
      color: 'border-red-500',
      description: 'Lập lịch thi và quản lý kỳ thi',
      bgColor: 'bg-red-50',
      route: '/exams'
    },
    {
      title: 'Quản lý giảng viên',
      icon: '👨‍🏫',
      color: 'border-cyan-500',
      description: 'Phân công giảng dạy và quản lý khối lượng công việc',
      bgColor: 'bg-cyan-50',
      route: '/teachers'
    },
    {
      title: 'Lập thời khóa biểu',
      icon: '⏰',
      color: 'border-lime-500',
      description: 'Sắp xếp lịch học và phòng học cho các lớp',
      bgColor: 'bg-lime-50',
      route: '/schedules'
    },
    {
      title: 'Quản lý tốt nghiệp',
      icon: '🎓',
      color: 'border-indigo-500',
      description: 'Xét tốt nghiệp và cấp bằng tốt nghiệp',
      bgColor: 'bg-indigo-50',
      route: '/graduation'
    }
  ]

  // Tin tức phù hợp với phòng đào tạo
  const newsItems = [
    {
      id: 1,
      title: 'Thông báo về lịch đăng ký học kỳ mới năm học 2025-2026',
      date: '2024-01-15',
      type: 'urgent'
    },
    {
      id: 2,
      title: 'Hướng dẫn cập nhật chương trình đào tạo theo chuẩn AUN-QA',
      date: '2024-01-12',
      type: 'info'
    },
    {
      id: 3,
      title: 'Quy định mới về đánh giá học tập và xét tốt nghiệp',
      date: '2024-01-10',
      type: 'warning'
    },
    {
      id: 4,
      title: 'Thông báo về hạn chót nộp báo cáo kết quả đào tạo',
      date: '2024-01-08',
      type: 'deadline'
    }
  ]

  const quickStats = [
    {
      label: 'Phòng ban',
      value: stats.totalDepartments,
      icon: Building,
      color: 'text-blue-600'
    },
    {
      label: 'Chức vụ',
      value: stats.totalPositions,
      icon: Award,
      color: 'text-green-600'
    },
    {
      label: 'Khối kiến thức',
      value: stats.totalKnowledgeBlocks,
      icon: GitBranch,
      color: 'text-purple-600'
    },
    {
      label: 'Lớp hoàn thành',
      value: stats.completedCohorts,
      icon: CheckCircle,
      color: 'text-orange-600'
    }
  ]

  // Mock data cho recent activities
  const recentActivities = [
    {
      id: 1,
      title: 'Phê duyệt đăng ký chuyển ngành',
      student: 'Nguyễn Văn A - CNTT K20',
      time: '10 phút trước',
      status: 'approved'
    },
    {
      id: 2,
      title: 'Cập nhật chương trình đào tạo',
      program: 'Kỹ thuật phần mềm',
      time: '30 phút trước',
      status: 'updated'
    },
    {
      id: 3,
      title: 'Đăng ký thi lại',
      student: 'Trần Thị B - QTKD K21',
      time: '1 giờ trước',
      status: 'pending'
    }
  ]

  const upcomingDeadlines = [
    {
      id: 1,
      task: 'Hoàn thành lịch thi cuối kỳ',
      deadline: '25/01/2024',
      priority: 'high'
    },
    {
      id: 2,
      task: 'Nộp báo cáo chất lượng đào tạo',
      deadline: '30/01/2024',
      priority: 'medium'
    },
    {
      id: 3,
      task: 'Cập nhật danh sách tốt nghiệp',
      deadline: '05/02/2024',
      priority: 'high'
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Phòng Đào Tạo</h1>
        <p className="text-gray-600 mt-2">Tổng quan hệ thống quản lý đào tạo</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Icon className={`w-6 h-6 ${stat.color}`} />
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Functional Modules */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Chức năng hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {functionalModules.map((module, index) => (
            <div 
              key={index} 
              className={`${module.bgColor} rounded-lg shadow-sm border-l-4 ${module.color} p-6 hover:shadow-md transition-all duration-200 cursor-pointer group`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {module.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Hoạt động gần đây
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'approved' ? 'bg-green-500' :
                  activity.status === 'updated' ? 'bg-blue-500' : 'bg-yellow-500'
                }`}></div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.student || activity.program}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Deadline sắp tới
          </h3>
          <div className="space-y-4">
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{deadline.task}</h4>
                  <p className="text-sm text-gray-600">{deadline.deadline}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deadline.priority === 'high' 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {deadline.priority === 'high' ? 'Cao' : 'Trung bình'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* News Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-1 h-8 bg-orange-500 mr-3"></div>
            <h2 className="text-2xl font-bold text-gray-900">Tin tức đào tạo</h2>
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Xem tất cả
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsItems.map((news) => (
            <div key={news.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
              <div className="absolute top-4 right-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  news.type === 'urgent' ? 'bg-red-100 text-red-800' :
                  news.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  news.type === 'deadline' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {news.type === 'urgent' ? '🔥' :
                   news.type === 'warning' ? '⚠️' :
                   news.type === 'deadline' ? '⏰' : 'ℹ️'}
                </div>
              </div>
              <div className="pr-12">
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-3">
                  {news.title}
                </h3>
                <p className="text-xs text-gray-500">{news.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            ⚡ Duyệt đăng ký học nhanh
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
            🔔 Tạo thông báo khẩn cấp
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            📊 Xuất báo cáo tuần
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
            🔍 Kiểm tra xung đột lịch học
          </button>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110">
          <span className="text-xl">🤖</span>
        </button>
      </div>
    </div>
  )
}

export default Dashboard