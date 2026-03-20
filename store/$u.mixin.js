import { mapState } from 'vuex'
import store from "@/store"

// 尝试将用户在根目录中的store/index.js的vuex的state变量，全部加载到全局变量中
let $uStoreKey = [];
try {
  $uStoreKey = store.state ? Object.keys(store.state) : [];
} catch (e) {
  console.error('获取 store keys 失败:', e);
}

export default {
  computed: {
    // 将vuex的state中的所有变量，解构到全局混入的mixin中
    ...mapState($uStoreKey)
  },
  methods: {
    // 【核心修复】：将 vuex 挂载方法移至 methods 中，完美兼容 Vue 3
    // 使用方法不变：this.vuex('user.name', '史诗')
    vuex(name, value) {
      // 兼容处理：优先使用上下文的 $store，如果丢失则直接使用引入的 store 实例
      const currentStore = this.$store || store;
      
      if (!currentStore) {
        console.error('未找到 Vuex Store 实例，请检查 main.js 中 app.use(store) 的配置');
        return;
      }

      currentStore.commit('$uStore', {
        name, 
        value
      });
    }
  }
}