import App from './App'
import mixin from '@/common/mixin'
// 导入API工厂SDK
import WXAPI from 'apifm-uniapp'
// 导入配置文件
import config from './config.js'

import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  
  // 初始化SDK
  WXAPI.init(config.subDomain)
  WXAPI.setMerchantId(config.merchantId)
  
  // 注册全局 mixin
  app.mixin(mixin)
  
  // 全局挂载
  app.config.globalProperties.$wxapi = WXAPI
  
  return {
    app
  }
}