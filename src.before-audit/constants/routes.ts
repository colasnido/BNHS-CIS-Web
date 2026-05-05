export const ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  ANNOUNCEMENTS: '/announcements',
  MEDIA: '/media',
  ABOUT: '/about',
  ADMIN: '/admin',
  AUTH: {
    FACULTY: '/auth/faculty',
    ADMIN: '/auth/admin',
    STUDENT: '/auth/student',
  },
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    FACULTY: '/dashboard/faculty',
    STUDENT: '/dashboard/student',
  },
} as const;

export const NAV_LINKS = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'About', href: ROUTES.ABOUT },
  { label: 'Events', href: ROUTES.EVENTS },
  { label: 'Announcements', href: ROUTES.ANNOUNCEMENTS },
  { label: 'Media', href: ROUTES.MEDIA },
] as const;

export const LOGIN_LINKS = [
  { label: 'Faculty', href: ROUTES.AUTH.FACULTY },
  { label: 'Admin', href: ROUTES.AUTH.ADMIN },
  { label: 'Student', href: ROUTES.AUTH.STUDENT },
] as const;

/**
 * Per-role sidebar nav for /dashboard/{role}/*.
 * Add/remove items here; the sidebar component reads from this list.
 */
export const ADMIN_NAV = [
  { label: 'Overview', href: '/dashboard/admin' },
  { label: 'Announcements', href: '/dashboard/admin/announcements' },
  { label: 'Events', href: '/dashboard/admin/events' },
  { label: 'Users', href: '/dashboard/admin/users' },
  { label: 'Classes', href: '/dashboard/admin/classes' },
  { label: 'Subjects', href: '/dashboard/admin/subjects' },
  { label: 'Schedules', href: '/dashboard/admin/schedules' },
] as const;

export const FACULTY_NAV = [
  { label: 'Overview', href: '/dashboard/faculty' },
  { label: 'My Students', href: '/dashboard/faculty/students' },
  { label: 'My Subjects', href: '/dashboard/faculty/subjects' },
  { label: 'Schedule', href: '/dashboard/faculty/schedule' },
] as const;

export const STUDENT_NAV = [
  { label: 'Overview', href: '/dashboard/student' },
  { label: 'Schedule', href: '/dashboard/student/schedule' },
  { label: 'Subjects', href: '/dashboard/student/subjects' },
  { label: 'My Adviser', href: '/dashboard/student/adviser' },
] as const;
