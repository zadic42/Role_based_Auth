import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentIcon,
  BellIcon,
  CalendarIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  InboxIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ArrowPathIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const userRole = localStorage.getItem('userRole')

  const userNavItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Team', icon: UserGroupIcon, path: '/team' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/analytics' },
    { name: 'Documents', icon: DocumentIcon, path: '/documents' },
    { name: 'Notifications', icon: BellIcon, path: '/notifications' },
    { name: 'Calendar', icon: CalendarIcon, path: '/calendar' },
    { name: 'Projects', icon: FolderIcon, path: '/projects' },
    { name: 'Messages', icon: ChatBubbleLeftRightIcon, path: '/messages' },
    { name: 'Inbox', icon: InboxIcon, path: '/inbox' },
    { name: 'Help Center', icon: QuestionMarkCircleIcon, path: '/help' },
    { name: 'Security', icon: ShieldCheckIcon, path: '/security' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' }
  ]

  const adminNavItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/admin/dashboard' },
    { name: 'Trainers', icon: UserPlusIcon, path: '/admin/trainers' },
    { name: 'Audit Logs', icon: ClipboardDocumentListIcon, path: '/admin/audit-logs' },
    { name: 'Error Logs', icon: ExclamationTriangleIcon, path: '/admin/error-logs' },
    { name: 'Backups', icon: ArrowPathIcon, path: '/admin/backups' },
    { name: 'System Performance', icon: CpuChipIcon, path: '/admin/performance' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/admin/settings' }
  ]

  const navItems = userRole === 'admin' ? adminNavItems : userNavItems

  return (
    <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="h-full overflow-y-auto py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'} ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar 