<script>
	import CONFIG from '@/config.js'
	import AUTH from '@/common/auth.js'
	
	export default {
		globalData: {
			curLat: undefined,
			curLong: undefined,
			adminLogined: false, // 登陆获取后台的 x-token，只需运行一次
			versionNum: ''       // 【修复】声明 versionNum 全局变量，防止未定义报错
		},
		onLaunch: function() {
			// 拦截器配置
			uni.addInterceptor('request', {
				success: (res) => {
					if(res.data.code == 2000) {
						// 【修复】移除 #ifdef H5，让小程序端也能生效；并加入清除 token 的逻辑
						uni.removeStorageSync('token')
						uni.showToast({
							title: '登录已过期，请重新登录',
							icon: 'none'
						})
						setTimeout(() => {
							uni.redirectTo({
								url: '/pages/login/login'
							})
						}, 1000)
					}
				},
			})
			
			// 【修改1】使用原生缓存保存版本号，并同步到 globalData
			const v = uni.getAppBaseInfo().appVersion
			uni.setStorageSync('versionNum', v)
			this.globalData.versionNum = v 
			
			this.checkForUpdate(); // 检查新版本
			this.queryConfigBatch();
		},
		onShow(e) {
			if (e && e.query && e.query.inviter_id) {
				// 【修改2】使用原生缓存保存推荐人
				uni.setStorageSync('referrer', e.query.inviter_id)
			}
			AUTH.checkHasLogined().then(isLogined => {
				if (!isLogined) {
					// #ifdef MP-WEIXIN
					AUTH.authorize().then(res => {
						this.getUserApiInfo()
					})
					// #endif
				} else {
					this.getUserApiInfo()
				}
			})
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			async queryConfigBatch() {
				const res = await this.$wxapi.queryConfigBatch(CONFIG.sysconfigkeys)
				if (res.code == 0) {
					const sysconfigMap = {}
					res.data.forEach(config => {
						if(config.key == 'bargain_data') {
							config.value = JSON.parse(config.value)
						}
						sysconfigMap[config.key] = config.value
					})
					// 【修改3】使用原生缓存保存系统配置
					uni.setStorageSync('sysconfigMap', sysconfigMap)
					// 发出全局通知，告诉所有页面和组件配置已加载完毕
					uni.$emit('sysconfigOK', sysconfigMap)
				}
			},
			checkForUpdate() {
				// #ifdef MP
				const updateManager = uni.getUpdateManager();
				updateManager.onCheckForUpdate(function(res) {
					console.log('是否有新版本：', res.hasUpdate);
				});
				updateManager.onUpdateReady(function(res) {
					uni.showModal({
						title: '更新提示',
						content: '新版本已经准备好，是否重启应用？',
						success(res) {
							if (res.confirm) {
								updateManager.applyUpdate();
							}
						}
					});
				});
				updateManager.onUpdateFailed(function(res) {
					// 新的版本下载失败
					uni.showToast({
						title: '新版本下载失败，请稍后再试',
						icon: 'none'
					})
				});
				// #endif
			},
			async getUserApiInfo() {
				// 【修改4】从缓存中读取 token
				const token = uni.getStorageSync('token')
				if (!token) return // 没有token就不请求
				
				const res = await this.$wxapi.userDetail(token)
				if (res.code == 0) {
					// 【修改5】
					uni.setStorageSync('apiUserInfoMap', res.data)
				}
			},
			async getLocation() {
				// 统一获取经纬度
				if (this.globalData.curLong && this.globalData.curLat) {
					return {
						long: this.globalData.curLong,
						lat: this.globalData.curLat
					}
				}
				const res = await this.$wxapi.getLocation()
				if (res) {
					this.globalData.curLong = res.long
					this.globalData.curLat = res.lat
					return res
				} else {
					return { long: 0, lat: 0 }
				}
			},
			async adminLogin() {
				if(this.globalData.adminLogined) return
				
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const res = await this.$wxapi.request('https://user.api.it120.cc/login/token', false, 'POST', {
					token: token
				})
				if (res.code == 0) {
					this.globalData.adminLogined = true
					// 【修改6】
					uni.setStorageSync('xtoken', res.data.token)
					uni.setStorageSync('shopIds', res.data.shopIds)
				}
			},
			async _shippingCarInfo() {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const res = await this.$wxapi.shippingCarInfo(token)
				if (res.code == 0) {
					uni.setStorageSync('shippingCarInfo', res.data)
				} else {
					uni.setStorageSync('shippingCarInfo', null)
				}
			},
			contactService() {
				// 【修改7】从缓存读取 sysconfigMap
				const sysconfigMap = uni.getStorageSync('sysconfigMap') || {}
				// #ifdef MP-WEIXIN
				this.handleMiniProgramBanner(sysconfigMap)
				// #endif
				
				// #ifndef MP-WEIXIN
				if (sysconfigMap.kf_tel) {
					uni.makePhoneCall({
						phoneNumber: sysconfigMap.kf_tel
					})
				}
				// #endif
			},
			handleMiniProgramBanner(sysconfigMap) {
				if (!sysconfigMap) sysconfigMap = uni.getStorageSync('sysconfigMap') || {}
				wx.openCustomerServiceChat({
					extInfo: { url: sysconfigMap.customerServiceChatUrl },
					corpId: sysconfigMap.customerServiceChatCorpId,
					success: res => {},
					fail: err => {
						console.error('打开客服失败:', err)
					}
				})
			} // 【修复】去掉了原来这里多余的三个大括号
		}
	}
</script>

<style>
	/* #ifdef H5 */  
	uni-page-head { display: none; }  
	/* #endif */
</style>