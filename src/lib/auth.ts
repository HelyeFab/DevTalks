import { User } from 'firebase/auth'

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

export function isAdmin(user: User | null): boolean {
  return user?.email === ADMIN_EMAIL
}

export function getRedirectPath(user: User | null): string {
  return isAdmin(user) ? '/admin/dashboard' : '/user/profile'
}
