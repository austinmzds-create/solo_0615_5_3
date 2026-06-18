import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus, { ElMessageBox, ElMessage } from 'element-plus'
import { createRouter, createMemoryHistory } from 'vue-router'
import LeaveApproval from './LeaveApproval.vue'
import { mockUsers } from '../mock/accounts'
import {
  getInitialApplications,
  saveApplications,
  STORAGE_KEY,
  type LeaveApplication
} from '../mock/leaves'
import { SESSION_USER_KEY } from '../utils/auth'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/leave-approval', component: LeaveApproval }
    ]
  })
}

const mountLeaveApproval = () => {
  return mount(LeaveApproval, {
    global: {
      plugins: [ElementPlus, createMockRouter()]
    }
  })
}

const setTeacherLogin = () => {
  const teacher = mockUsers.find((u) => u.role === 'teacher')!
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(teacher))
}

const clearStorage = () => {
  sessionStorage.removeItem(SESSION_USER_KEY)
  localStorage.removeItem(STORAGE_KEY)
}

const findPendingTab = (wrapper: any) => {
  return wrapper.findAll('.el-tabs__item').find((el: any) => el.text().includes('待审批'))
}

const findApproveButtonByRow = (wrapper: any, applicationId: string) => {
  const rows = wrapper.findAll('.el-table__body-wrapper .el-table__row')
  for (const row of rows) {
    if (row.text().includes(applicationId)) {
      const buttons = row.findAll('button')
      return buttons.find((btn: any) => btn.text().includes('通过'))
    }
  }
  return null
}

const findRowById = (wrapper: any, applicationId: string) => {
  const rows = wrapper.findAll('.el-table__body-wrapper .el-table__row')
  return rows.find((row: any) => row.text().includes(applicationId)) || null
}

const getPendingCountFromBadge = (wrapper: any) => {
  const tab = findPendingTab(wrapper)
  if (!tab) return -1
  const badge = tab.find('.el-badge__content')
  if (!badge.exists()) return 0
  return parseInt(badge.text().trim(), 10) || 0
}

describe('LeaveApproval.vue', () => {
  beforeEach(() => {
    clearStorage()
    setTeacherLogin()
    vi.useFakeTimers()
  })

  afterEach(() => {
    clearStorage()
    vi.useRealTimers()
  })

  describe('教师切到待审批筛选后通过某条申请', () => {
    it('当前表格要按同一 id 立即移除，重新挂载后也不再回到待审批', async () => {
      const wrapper = mountLeaveApproval()
      await vi.advanceTimersByTimeAsync(100)
      await wrapper.vm.$nextTick()

      const pendingTab = findPendingTab(wrapper)
      expect(pendingTab).not.toBeUndefined()

      await pendingTab!.trigger('click')
      await vi.advanceTimersByTimeAsync(100)
      await wrapper.vm.$nextTick()

      const initialApplications = getInitialApplications()
      const pendingApplications = initialApplications.filter((a) => a.status === 'pending')
      expect(pendingApplications.length).toBeGreaterThan(0)

      const targetApplication = pendingApplications[0]
      const targetId = targetApplication.id

      const initialPendingCount = getPendingCountFromBadge(wrapper)
      expect(initialPendingCount).toBe(pendingApplications.length)

      const rowBefore = findRowById(wrapper, targetId)
      expect(rowBefore).not.toBeNull()

      const approveButton = findApproveButtonByRow(wrapper, targetId)
      expect(approveButton).not.toBeNull()

      vi.spyOn(ElMessageBox, 'confirm').mockResolvedValueOnce(undefined as never)
      vi.spyOn(ElMessage, 'success').mockImplementation(() => ({} as any))

      await approveButton!.trigger('click')
      await vi.advanceTimersByTimeAsync(100)
      await wrapper.vm.$nextTick()

      const rowAfter = findRowById(wrapper, targetId)
      expect(rowAfter).toBeNull()

      const pendingCountAfter = getPendingCountFromBadge(wrapper)
      expect(pendingCountAfter).toBe(initialPendingCount - 1)

      const storedApplications = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      ) as LeaveApplication[]
      const storedTarget = storedApplications.find((a) => a.id === targetId)
      expect(storedTarget).toBeDefined()
      expect(storedTarget!.status).toBe('approved')

      wrapper.unmount()

      const wrapper2 = mountLeaveApproval()
      await vi.advanceTimersByTimeAsync(100)
      await wrapper2.vm.$nextTick()

      const pendingTab2 = findPendingTab(wrapper2)
      expect(pendingTab2).not.toBeUndefined()

      await pendingTab2!.trigger('click')
      await vi.advanceTimersByTimeAsync(100)
      await wrapper2.vm.$nextTick()

      const rowAfterRemount = findRowById(wrapper2, targetId)
      expect(rowAfterRemount).toBeNull()

      const pendingCountAfterRemount = getPendingCountFromBadge(wrapper2)
      expect(pendingCountAfterRemount).toBe(initialPendingCount - 1)

      const storedAfterRemount = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      ) as LeaveApplication[]
      const storedTargetAfterRemount = storedAfterRemount.find((a) => a.id === targetId)
      expect(storedTargetAfterRemount).toBeDefined()
      expect(storedTargetAfterRemount!.status).toBe('approved')

      wrapper2.unmount()
    })
  })
})
