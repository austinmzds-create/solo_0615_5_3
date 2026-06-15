<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { validateLogin } from '../utils/auth'
import { mockUsers, type MockUser } from '../mock/accounts'

const REMEMBERED_USERNAME_KEY = 'smart_campus_remembered_username'

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const loggedInUser = ref<MockUser | null>(null)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(() => {
  const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY)
  if (rememberedUsername) {
    loginForm.username = rememberedUsername
    rememberMe.value = true
  }
})

const handleRememberMeChange = (val: boolean) => {
  if (!val) {
    localStorage.removeItem(REMEMBERED_USERNAME_KEY)
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate((valid) => {
    if (!valid) return

    loading.value = true
    setTimeout(() => {
      const result = validateLogin(loginForm.username, loginForm.password)
      if (result.success && result.user) {
        if (rememberMe.value) {
          localStorage.setItem(REMEMBERED_USERNAME_KEY, loginForm.username)
        } else {
          localStorage.removeItem(REMEMBERED_USERNAME_KEY)
        }
        loggedInUser.value = result.user
        ElMessage.success(result.message)
      } else {
        ElMessage.error(result.message)
      }
      loading.value = false
    }, 500)
  })
}

const handleLogout = () => {
  loggedInUser.value = null
  loginForm.password = ''
  if (!rememberMe.value) {
    loginForm.username = ''
  }
}
</script>

<template>
  <div class="login-container">
    <div v-if="!loggedInUser" class="login-card">
      <h1 class="system-title">智慧校园管理系统</h1>
      <h2 class="system-subtitle">Smart Campus Management System</h2>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入账号"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe" @change="handleRememberMeChange">
            记住账号
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider>测试账号</el-divider>

      <div class="test-accounts">
        <el-alert
          v-for="user in mockUsers"
          :key="user.role"
          :title="`${user.roleLabel}：${user.username} / ${user.password}（${user.name}）`"
          type="info"
          :closable="false"
          show-icon
          class="account-item"
        />
      </div>
    </div>

    <div v-else class="success-card">
      <el-result icon="success" title="登录成功">
        <template #sub-title>
          <div class="user-info">
            <p>
              <span class="label">姓名：</span>
              <span class="value">{{ loggedInUser.name }}</span>
            </p>
            <p>
              <span class="label">角色：</span>
              <el-tag :type="loggedInUser.role === 'admin' ? 'danger' : loggedInUser.role === 'teacher' ? 'warning' : 'success'">
                {{ loggedInUser.roleLabel }}
              </el-tag>
            </p>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" @click="handleLogout">退出登录</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.success-card {
  width: 480px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.system-title {
  text-align: center;
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.system-subtitle {
  text-align: center;
  margin: 0 0 32px;
  font-size: 14px;
  font-weight: 400;
  color: #909399;
  letter-spacing: 1px;
}

.login-form {
  margin-bottom: 0;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 8px;
}

.test-accounts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.account-item :deep(.el-alert__content) {
  width: 100%;
}

.user-info {
  text-align: left;
  padding: 16px 24px;
  background: #f5f7fa;
  border-radius: 8px;
}

.user-info p {
  margin: 8px 0;
  font-size: 15px;
}

.user-info .label {
  color: #606266;
  font-weight: 500;
}

.user-info .value {
  color: #303133;
  font-weight: 600;
}
</style>
