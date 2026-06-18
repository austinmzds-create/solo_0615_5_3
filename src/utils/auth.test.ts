import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  SESSION_USER_KEY,
  saveSessionUser,
  getSessionUser,
  clearSessionUser,
  getRoleDashboardRoute,
  validateLogin
} from './auth'
import { mockUsers } from '../mock/accounts'

describe('auth utils', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('validateLogin', () => {
    it('应返回成功并包含用户信息，当账号密码正确时', () => {
      const teacher = mockUsers[1]
      const result = validateLogin(teacher.username, teacher.password)
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.username).toBe(teacher.username)
      expect(result.message).toBe('登录成功')
    })

    it('应返回失败，当账号不存在时', () => {
      const result = validateLogin('nonexistent', 'anypassword')
      expect(result.success).toBe(false)
      expect(result.user).toBeUndefined()
      expect(result.message).toBe('账号不存在')
    })

    it('应返回失败，当密码错误时', () => {
      const teacher = mockUsers[1]
      const result = validateLogin(teacher.username, 'wrongpassword')
      expect(result.success).toBe(false)
      expect(result.user).toBeUndefined()
      expect(result.message).toBe('密码错误')
    })

    it('应返回失败，当账号或密码为空时', () => {
      const result1 = validateLogin('', 'password')
      expect(result1.success).toBe(false)
      expect(result1.message).toBe('请输入账号和密码')

      const result2 = validateLogin('username', '')
      expect(result2.success).toBe(false)
    })
  })

  describe('会话管理 - sessionStorage', () => {
    it('saveSessionUser 应将用户信息保存到 sessionStorage', () => {
      const teacher = mockUsers[1]
      saveSessionUser(teacher)

      const stored = sessionStorage.getItem(SESSION_USER_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed.username).toBe(teacher.username)
      expect(parsed.role).toBe(teacher.role)
      expect(parsed.name).toBe(teacher.name)
    })

    it('getSessionUser 应从 sessionStorage 读取并返回有效用户', () => {
      const teacher = mockUsers[1]
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(teacher))

      const user = getSessionUser()
      expect(user).not.toBeNull()
      expect(user?.username).toBe(teacher.username)
      expect(user?.role).toBe(teacher.role)
      expect(user?.roleLabel).toBe(teacher.roleLabel)
    })

    it('getSessionUser 应返回 null，当 sessionStorage 中没有会话时', () => {
      const user = getSessionUser()
      expect(user).toBeNull()
    })

    it('getSessionUser 应返回 null 并清除无效会话，当用户不存在于 mock 数据中时', () => {
      const fakeUser = {
        username: 'fakeuser',
        password: 'fakepass',
        name: '假用户',
        role: 'teacher',
        roleLabel: '教师'
      }
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(fakeUser))

      const user = getSessionUser()
      expect(user).toBeNull()
      expect(sessionStorage.getItem(SESSION_USER_KEY)).toBeNull()
    })

    it('getSessionUser 应返回 null 并清除损坏的会话数据', () => {
      sessionStorage.setItem(SESSION_USER_KEY, 'not-valid-json{')

      const user = getSessionUser()
      expect(user).toBeNull()
      expect(sessionStorage.getItem(SESSION_USER_KEY)).toBeNull()
    })

    it('clearSessionUser 应清除 sessionStorage 中的会话', () => {
      const teacher = mockUsers[1]
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(teacher))

      clearSessionUser()

      expect(sessionStorage.getItem(SESSION_USER_KEY)).toBeNull()
    })
  })

  describe('getRoleDashboardRoute', () => {
    it('教师角色应返回 /leave-approval', () => {
      expect(getRoleDashboardRoute('teacher')).toBe('/leave-approval')
    })

    it('管理员角色应返回 null（暂无工作台）', () => {
      expect(getRoleDashboardRoute('admin')).toBeNull()
    })

    it('学生角色应返回 null（暂无工作台）', () => {
      expect(getRoleDashboardRoute('student')).toBeNull()
    })

    it('未知角色应返回 null', () => {
      expect(getRoleDashboardRoute('unknown')).toBeNull()
    })
  })
})
