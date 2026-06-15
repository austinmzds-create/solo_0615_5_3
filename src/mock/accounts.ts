export type UserRole = 'admin' | 'teacher' | 'student'

export interface MockUser {
  username: string
  password: string
  name: string
  role: UserRole
  roleLabel: string
}

export const mockUsers: MockUser[] = [
  {
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'admin',
    roleLabel: '管理员'
  },
  {
    username: 'teacher',
    password: 'teacher123',
    name: '李老师',
    role: 'teacher',
    roleLabel: '教师'
  },
  {
    username: 'student',
    password: 'student123',
    name: '张同学',
    role: 'student',
    roleLabel: '学生'
  }
]
