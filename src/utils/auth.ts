import { mockUsers, type MockUser } from '../mock/accounts'

export const SESSION_USER_KEY = 'smart_campus_session_user'

export interface LoginResult {
  success: boolean
  message: string
  user?: MockUser
}

export function validateLogin(username: string, password: string): LoginResult {
  if (!username || !password) {
    return {
      success: false, message: '请输入账号和密码' }
  }

  const user = mockUsers.find((u) => u.username === username)

  if (!user) {
    return {
      success: false,
      message: '账号不存在'
    }
  }

  if (user.password !== password) {
    return {
      success: false,
      message: '密码错误'
    }
  }

  return {
    success: true,
    message: '登录成功',
    user
  }
}

export function saveSessionUser(user: MockUser): void {
  try {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
  } catch (e) {
    console.error('保存会话失败', e)
  }
}

export function getSessionUser(): MockUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as MockUser
    const validUser = mockUsers.find((u) => u.username === user.username)
    if (!validUser) {
      sessionStorage.removeItem(SESSION_USER_KEY)
      return null
    }
    return validUser
  } catch (e) {
    sessionStorage.removeItem(SESSION_USER_KEY)
    return null
  }
}

export function clearSessionUser(): void {
  sessionStorage.removeItem(SESSION_USER_KEY)
}

export function getRoleDashboardRoute(role: string): string | null {
  switch (role) {
    case 'teacher':
      return '/leave-approval'
    default:
      return null
  }
}
