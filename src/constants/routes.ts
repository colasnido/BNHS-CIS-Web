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
