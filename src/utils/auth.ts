import { mockUsers, type MockUser } from '../mock/accounts'

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
