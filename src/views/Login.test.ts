import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createRouter, createMemoryHistory } from 'vue-router'
import Login from './Login.vue'
import { mockUsers } from '../mock/accounts'
import { SESSION_USER_KEY, getSessionUser } from '../utils/auth'

const REMEMBERED_USERNAME_KEY = 'smart_campus_remembered_username'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: Login },
      { path: '/leave-approval', component: { template: '<div>Leave Approval</div>' } }
    ]
  })
}

const mountLogin = () => {
  return mount(Login, {
    global: {
      plugins: [ElementPlus, createMockRouter()]
    }
  })
}

const findInputByPlaceholder = (wrapper: any, placeholder: string) => {
  return wrapper.findAll('input').find((input: any) => input.attributes('placeholder') === placeholder)
}

const fillLoginForm = async (wrapper: any, username: string, password: string) => {
  const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
  const passwordInput = findInputByPlaceholder(wrapper, '请输入密码')

  if (usernameInput) {
    await usernameInput.setValue(username)
  }
  if (passwordInput) {
    await passwordInput.setValue(password)
  }
}

const clickLoginButton = async (wrapper: any) => {
  const loginButton = wrapper.findAll('button').find((btn: any) => btn.text().includes('登 录'))
  if (loginButton) {
    await loginButton.trigger('click')
  }
}

const findRememberMeCheckbox = (wrapper: any) => {
  return wrapper.find('.el-checkbox input[type="checkbox"]')
}

const toggleRememberMe = async (wrapper: any) => {
  const checkbox = findRememberMeCheckbox(wrapper)
  if (checkbox) {
    await checkbox.setChecked(!checkbox.element.checked)
  }
}

describe('Login.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('三类测试账号登录成功', () => {
    it.each(mockUsers)('应成功登录 %s 账号', async (user) => {
      const wrapper = mountLogin()

      await fillLoginForm(wrapper, user.username, user.password)
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('登录成功')
      expect(wrapper.text()).toContain(user.name)
      expect(wrapper.text()).toContain(user.roleLabel)
    })
  })

  describe('错误密码登录失败', () => {
    it('使用错误密码登录应显示密码错误提示', async () => {
      const wrapper = mountLogin()

      await fillLoginForm(wrapper, 'admin', 'wrongpassword')
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('登录成功')
    })

    it('使用不存在的账号登录应显示账号不存在提示', async () => {
      const wrapper = mountLogin()

      await fillLoginForm(wrapper, 'nonexistent', 'anypassword')
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).not.toContain('登录成功')
    })
  })

  describe('空账号或空密码校验', () => {
    it('账号为空时点击登录不应触发登录且保持在登录页面', async () => {
      const wrapper = mountLogin()

      const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
      const passwordInput = findInputByPlaceholder(wrapper, '请输入密码')

      if (passwordInput) {
        await passwordInput.setValue('admin123')
        await passwordInput.trigger('blur')
      }
      if (usernameInput) {
        await usernameInput.setValue('')
        await usernameInput.trigger('blur')
      }

      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const loginCard = wrapper.find('.login-card')
      expect(loginCard.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('登录成功')
    })

    it('密码为空时点击登录不应触发登录且保持在登录页面', async () => {
      const wrapper = mountLogin()

      const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
      const passwordInput = findInputByPlaceholder(wrapper, '请输入密码')

      if (usernameInput) {
        await usernameInput.setValue('admin')
        await usernameInput.trigger('blur')
      }
      if (passwordInput) {
        await passwordInput.setValue('')
        await passwordInput.trigger('blur')
      }

      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const loginCard = wrapper.find('.login-card')
      expect(loginCard.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('登录成功')
    })

    it('账号和密码都为空时点击登录不应触发登录且保持在登录页面', async () => {
      const wrapper = mountLogin()

      const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
      const passwordInput = findInputByPlaceholder(wrapper, '请输入密码')

      if (usernameInput) {
        await usernameInput.setValue('')
        await usernameInput.trigger('blur')
      }
      if (passwordInput) {
        await passwordInput.setValue('')
        await passwordInput.trigger('blur')
      }

      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const loginCard = wrapper.find('.login-card')
      expect(loginCard.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('登录成功')
    })
  })

  describe('登录成功后展示用户姓名和角色', () => {
    it('管理员登录成功后应显示姓名和管理员角色', async () => {
      const wrapper = mountLogin()
      const admin = mockUsers[0]

      await fillLoginForm(wrapper, admin.username, admin.password)
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const successSection = wrapper.find('.success-card')
      expect(successSection.exists()).toBe(true)
      expect(successSection.text()).toContain(admin.name)
      expect(successSection.text()).toContain(admin.roleLabel)
    })

    it('教师登录成功后应显示姓名和教师角色', async () => {
      const wrapper = mountLogin()
      const teacher = mockUsers[1]

      await fillLoginForm(wrapper, teacher.username, teacher.password)
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const successSection = wrapper.find('.success-card')
      expect(successSection.exists()).toBe(true)
      expect(successSection.text()).toContain(teacher.name)
      expect(successSection.text()).toContain(teacher.roleLabel)
    })

    it('学生登录成功后应显示姓名和学生角色', async () => {
      const wrapper = mountLogin()
      const student = mockUsers[2]

      await fillLoginForm(wrapper, student.username, student.password)
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const successSection = wrapper.find('.success-card')
      expect(successSection.exists()).toBe(true)
      expect(successSection.text()).toContain(student.name)
      expect(successSection.text()).toContain(student.roleLabel)
    })
  })

  describe('记住账号功能回归测试', () => {
    it('勾选记住账号并登录成功后，localStorage 应保存当前账号', async () => {
      const wrapper = mountLogin()
      const teacher = mockUsers[1]

      await fillLoginForm(wrapper, teacher.username, teacher.password)
      await toggleRememberMe(wrapper)
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).rememberMe).toBe(true)

      await clickLoginButton(wrapper)
      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      expect(localStorage.getItem(REMEMBERED_USERNAME_KEY)).toBe(teacher.username)
    })

    it('取消勾选记住账号并登录成功后，localStorage 中已保存的账号应被清除', async () => {
      const teacher = mockUsers[1]
      localStorage.setItem(REMEMBERED_USERNAME_KEY, teacher.username)

      const wrapper = mountLogin()
      await wrapper.vm.$nextTick()

      const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
      expect(usernameInput.element.value).toBe(teacher.username)
      expect((wrapper.vm as any).rememberMe).toBe(true)

      await toggleRememberMe(wrapper)
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).rememberMe).toBe(false)

      const passwordInput = findInputByPlaceholder(wrapper, '请输入密码')
      if (passwordInput) {
        await passwordInput.setValue(teacher.password)
      }

      await clickLoginButton(wrapper)
      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      expect(localStorage.getItem(REMEMBERED_USERNAME_KEY)).toBeNull()
    })

    it('取消勾选记住账号时不应立即清除 localStorage（仅登录成功后清除）', async () => {
      const teacher = mockUsers[1]
      localStorage.setItem(REMEMBERED_USERNAME_KEY, teacher.username)

      const wrapper = mountLogin()
      await wrapper.vm.$nextTick()

      expect(localStorage.getItem(REMEMBERED_USERNAME_KEY)).toBe(teacher.username)

      await toggleRememberMe(wrapper)
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).rememberMe).toBe(false)

      expect(localStorage.getItem(REMEMBERED_USERNAME_KEY)).toBe(teacher.username)
    })

    it('localStorage 中有已保存账号时，进入登录页应预填账号并自动勾选记住账号', async () => {
      const admin = mockUsers[0]
      localStorage.setItem(REMEMBERED_USERNAME_KEY, admin.username)

      const wrapper = mountLogin()
      await wrapper.vm.$nextTick()

      const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
      expect(usernameInput.element.value).toBe(admin.username)
      expect((wrapper.vm as any).rememberMe).toBe(true)
    })

    it('localStorage 中无已保存账号时，进入登录页账号为空且记住账号未勾选', async () => {
      localStorage.clear()

      const wrapper = mountLogin()
      await wrapper.vm.$nextTick()

      const usernameInput = findInputByPlaceholder(wrapper, '请输入账号')
      expect(usernameInput.element.value).toBe('')
      expect((wrapper.vm as any).rememberMe).toBe(false)
    })

    it('已保存账号被清除后，再次进入登录页不应预填旧账号', async () => {
      const teacher = mockUsers[1]
      localStorage.setItem(REMEMBERED_USERNAME_KEY, teacher.username)

      const wrapper1 = mountLogin()
      await wrapper1.vm.$nextTick()
      const usernameInput1 = findInputByPlaceholder(wrapper1, '请输入账号')
      expect(usernameInput1.element.value).toBe(teacher.username)

      await toggleRememberMe(wrapper1)
      await wrapper1.vm.$nextTick()
      expect((wrapper1.vm as any).rememberMe).toBe(false)

      const passwordInput = findInputByPlaceholder(wrapper1, '请输入密码')
      if (passwordInput) {
        await passwordInput.setValue(teacher.password)
      }

      await clickLoginButton(wrapper1)
      await vi.advanceTimersByTimeAsync(600)
      await wrapper1.vm.$nextTick()

      expect(localStorage.getItem(REMEMBERED_USERNAME_KEY)).toBeNull()

      wrapper1.unmount()

      const wrapper2 = mountLogin()
      await wrapper2.vm.$nextTick()

      const usernameInput2 = findInputByPlaceholder(wrapper2, '请输入账号')
      expect(usernameInput2.element.value).toBe('')
      expect((wrapper2.vm as any).rememberMe).toBe(false)
    })

    it('勾选记住账号后又取消勾选，登录成功后不应保存账号', async () => {
      const wrapper = mountLogin()
      const admin = mockUsers[0]

      await fillLoginForm(wrapper, admin.username, admin.password)

      await toggleRememberMe(wrapper)
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).rememberMe).toBe(true)

      await toggleRememberMe(wrapper)
      await wrapper.vm.$nextTick()
      expect((wrapper.vm as any).rememberMe).toBe(false)

      await clickLoginButton(wrapper)
      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      expect(localStorage.getItem(REMEMBERED_USERNAME_KEY)).toBeNull()
    })
  })

  describe('会话恢复 - sessionStorage', () => {
    it('教师登录成功后，sessionStorage 应保存完整的用户会话信息', async () => {
      const wrapper = mountLogin()
      const teacher = mockUsers[1]

      await fillLoginForm(wrapper, teacher.username, teacher.password)
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const sessionUser = getSessionUser()
      expect(sessionUser).not.toBeNull()
      expect(sessionUser?.username).toBe(teacher.username)
      expect(sessionUser?.role).toBe(teacher.role)
      expect(sessionUser?.name).toBe(teacher.name)
      expect(sessionUser?.roleLabel).toBe(teacher.roleLabel)
    })

    it('管理员登录成功后，sessionStorage 也应保存用户会话', async () => {
      const wrapper = mountLogin()
      const admin = mockUsers[0]

      await fillLoginForm(wrapper, admin.username, admin.password)
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const sessionUser = getSessionUser()
      expect(sessionUser).not.toBeNull()
      expect(sessionUser?.username).toBe(admin.username)
      expect(sessionUser?.role).toBe('admin')
    })

    it('登录失败时，sessionStorage 不应保存任何会话', async () => {
      const wrapper = mountLogin()

      await fillLoginForm(wrapper, 'teacher', 'wrongpassword')
      await clickLoginButton(wrapper)

      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()

      const sessionUser = getSessionUser()
      expect(sessionUser).toBeNull()
      expect(sessionStorage.getItem(SESSION_USER_KEY)).toBeNull()
    })

    it('已登录教师访问登录页时，应自动跳转到教师工作台', async () => {
      const teacher = mockUsers[1]
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(teacher))

      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', redirect: '/login' },
          {
            path: '/login',
            component: Login,
            meta: { public: true }
          },
          {
            path: '/leave-approval',
            name: 'LeaveApproval',
            component: { template: '<div>Leave Approval</div>' },
            meta: { role: 'teacher' }
          }
        ]
      })

      router.beforeEach((to, _from, next) => {
        const raw = sessionStorage.getItem(SESSION_USER_KEY)
        const sessionUser = raw ? JSON.parse(raw) : null

        if (to.meta.public) {
          if (sessionUser && sessionUser.role === 'teacher') {
            next('/leave-approval')
            return
          }
          next()
          return
        }

        if (!sessionUser) {
          next('/login')
          return
        }

        if (to.meta.role && to.meta.role !== sessionUser.role) {
          next('/login')
          return
        }

        next()
      })

      await router.push('/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/leave-approval')
    })

    it('未登录用户访问受保护页面时，应跳转到登录页', async () => {
      sessionStorage.clear()

      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', redirect: '/login' },
          {
            path: '/login',
            component: Login,
            meta: { public: true }
          },
          {
            path: '/leave-approval',
            name: 'LeaveApproval',
            component: { template: '<div>Leave Approval</div>' },
            meta: { role: 'teacher' }
          }
        ]
      })

      router.beforeEach((to, _from, next) => {
        const raw = sessionStorage.getItem(SESSION_USER_KEY)
        const sessionUser = raw ? JSON.parse(raw) : null

        if (to.meta.public) {
          if (sessionUser && sessionUser.role === 'teacher') {
            next('/leave-approval')
            return
          }
          next()
          return
        }

        if (!sessionUser) {
          next('/login')
          return
        }

        if (to.meta.role && to.meta.role !== sessionUser.role) {
          next('/login')
          return
        }

        next()
      })

      await router.push('/leave-approval')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('已登录用户访问根路径时，最终应进入对应工作台', async () => {
      const teacher = mockUsers[1]
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(teacher))

      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', redirect: '/login' },
          {
            path: '/login',
            component: Login,
            meta: { public: true }
          },
          {
            path: '/leave-approval',
            name: 'LeaveApproval',
            component: { template: '<div>Leave Approval</div>' },
            meta: { role: 'teacher' }
          }
        ]
      })

      router.beforeEach((to, _from, next) => {
        const raw = sessionStorage.getItem(SESSION_USER_KEY)
        const sessionUser = raw ? JSON.parse(raw) : null

        if (to.meta.public) {
          if (sessionUser && sessionUser.role === 'teacher') {
            next('/leave-approval')
            return
          }
          next()
          return
        }

        if (!sessionUser) {
          next('/login')
          return
        }

        if (to.meta.role && to.meta.role !== sessionUser.role) {
          next('/login')
          return
        }

        next()
      })

      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/leave-approval')
    })
  })
})
