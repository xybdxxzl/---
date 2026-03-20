import App from './App'
import { createSSRApp } from 'vue'

import store from '@/store'
import vuexStore from '@/store/$u.mixin.js'
import mixin from '@/common/mixin'

// 导入API工厂SDK
import WXAPI from 'apifm-uniapp'
// 导入配置文件
import config from './config.js'

export function createApp() {
  const app = createSSRApp(App)

  // 1. 初始化SDK
  WXAPI.init(config.subDomain)
  WXAPI.setMerchantId(config.merchantId)

  // 2. 挂载 Vuex (必须放在 mixin 之前)
  app.use(store)

  // 3. 挂载全局属性 (这是 Vue 3 替代 Vue.prototype 的标准做法)
  app.config.globalProperties.$wxapi = WXAPI
  app.config.globalProperties.$store = store // 确保 mixin 能通过 this.$store 访问到 vuex

  // 4. 注册全局 mixin
  app.mixin(vuexStore)
  app.mixin(mixin)

  // 5. 严格返回 app 对象
  return {
    app
  }
}