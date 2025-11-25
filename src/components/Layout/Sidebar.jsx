import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  GraduationCap,
  BookOpen,
  Layers,
  GitBranch,
  ClipboardList,
  Settings,
  Users,
  ChevronRight,
  Calculator
} from 'lucide-react'

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()

  // Menu chính
  const mainMenuItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
  ]

  // Quản lý đào tạo
  const trainingManagementItems = [
    { path: '/majors', label: 'Quản lý ngành học', icon: GraduationCap },
    { path: '/cohort', label: 'Quản lý khoá học', icon: BookOpen },
    { path: '/subjects', label: 'Quản lý học phần', icon: Layers },
    { path: '/knowledge-blocks', label: 'Quản lý khối kiến thức', icon: GitBranch },
    { path: '/programs', label: 'Quản lý chương trình', icon: ClipboardList },
  ]

  // Tài chính
  const financeItems = [
    { path: '/tuition-calculator', label: 'Tính học phí', icon: Calculator },
  ]

  // Quản lý hệ thống (chỉ giữ cơ cấu tổ chức)
  const systemManagementItems = [
    { path: '/departments', label: 'Quản lý phòng ban, khoa & chức vụ', icon: Settings },
  ]

  // Quản lý nhân sự (mới thêm)
  const employeeManagementItems = [
    { path: '/lecturers', label: 'Quản lý giảng viên', icon: Users },
    { path: '/staff', label: 'Quản lý nhân viên hành chính', icon: Users },
  ]

  const handleNavigation = (path) => {
    if (window.innerWidth < 1024) {
      onToggle()
    }
  }

  const currentPathWithSearch = `${location.pathname}${location.search}`

  const MenuSection = ({ title, items, className = "" }) => (
    <div className={`space-y-1 ${className}`}>
      {title && (
        <h3 className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.path.includes('?')
          ? currentPathWithSearch === item.path
          : location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
            onClick={() => handleNavigation(item.path)}
          >
            <Icon className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'translate-x-1' : ''}`} />
          </Link>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar chính */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-blue-900">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-white font-bold text-sm">PHENIKAA UNIVERSITY</span>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 bg-blue-700 border-b border-blue-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">PT</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Phòng Đào Tạo</p>
                <p className="text-blue-200 text-xs">Quản lý cấp cao</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#93c5fd #1e40af'
          }}>
            <MenuSection items={mainMenuItems} />
            <MenuSection
              title="Quản lý đào tạo"
              items={trainingManagementItems}
              className="pt-4 border-t border-blue-700"
            />
            <MenuSection
              title="Tài chính"
              items={financeItems}
              className="pt-4 border-t border-blue-700"
            />
            <MenuSection
              title="Quản lý cơ cấu tổ chức"
              items={systemManagementItems}
              className="pt-4 border-t border-blue-700"
            />
            <MenuSection
              title="Quản lý nhân sự"
              items={employeeManagementItems}
              className="pt-4 border-t border-blue-700"
            />
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 bg-blue-900 border-t border-blue-700 text-center text-blue-200 text-xs">
            © 2025 Phenikaa University
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
