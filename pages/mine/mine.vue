<template>
	<view class="mine-page">
		<view v-if="userInfo && userInfo.base" class="user-info" @click="info">
			<view class="user-avatar">
				<image class="avatar" :src="userInfo.base.avatarUrl || '/static/images/avatarUrl.png'" mode="aspectFill">
				</image>
			</view>
			<view class="user-details">
				<text class="username">{{ userInfo.base.nick || '测试名字' }}</text>
				<text class="phone">ID：{{ userInfo.base.id }}</text>
			</view>
			<view class="setting-btn">
				<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
			</view>
		</view>
		<view v-else class="user-info" @click="goToLogin">
			<view class="user-avatar">
				<image class="avatar" src="/static/images/avatarUrl.png" mode="aspectFill"></image>
			</view>
			<view class="user-details">
				<text class="username">点击登录</text>
				<text class="phone">登录后享受更多服务</text>
			</view>
			<view class="setting-btn">
				<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
			</view>
		</view>

		<view class="menu-section">
			<view class="menu-item" @click="goToAddress">
				<view class="menu-icon">
					<image src="/static/images/mine/address.png" mode="aspectFit"></image>
				</view>
				<text class="menu-title">地址管理</text>
				<view class="menu-arrow">
					<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
				</view>
			</view>

			<view class="menu-divider"></view>

			<view class="menu-item" @click="goToFeedback">
				<view class="menu-icon">
					<image src="/static/images/mine/mail.png" mode="aspectFit"></image>
				</view>
				<text class="menu-title">用户反馈</text>
				<view class="menu-arrow">
					<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
				</view>
			</view>

			<view class="menu-divider"></view>
			<view class="menu-item" @click="about">
				<view class="menu-icon">
					<image src="/static/images/mine/about.png" mode="aspectFit"></image>
				</view>
				<text class="menu-title">关于我们</text>
				<view class="menu-arrow">
					<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
				</view>
			</view>

			<view class="menu-divider"></view>
			<view class="menu-item" @click="contactService">
				<view class="menu-icon">
					<image src="/static/images/mine/service.svg" mode="aspectFit"></image>
				</view>
				<text class="menu-title">联系客服</text>
				<view class="menu-arrow">
					<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
				</view>
			</view>

			<view class="menu-divider"></view>
			<view class="menu-item" @click="goToDiscovery">
				<view class="menu-icon">
					<image src="/static/images/mine/scan.png" mode="aspectFit"></image>
				</view>
				<text class="menu-title">实验室功能</text>
				<view class="menu-arrow">
					<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
				</view>
			</view>
		</view>
		
		<view class="login-out">
			<button type="default" @click="loginOut">退出登陆</button>
		</view>
		<view class="versionNum">ver {{ versionNum || '1.0.0' }}</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: null,
				recycleWeight: 0
			}
		},
		onLoad() {

		},
		onShow() {
			this.userDetail()
		},
		onShareAppMessage() {
			const uid = uni.getStorageSync('uid') || ''
			const mallName = this.sysconfigMap && this.sysconfigMap.mallName ? this.sysconfigMap.mallName : '平台分享'
			const imageUrl = this.sysconfigMap && this.sysconfigMap.share_pic ? this.sysconfigMap.share_pic : ''
			
			return {
				title: mallName + ' - 闲置废品换钱',
				path: '/pages/index/index?inviter_id=' + uid,
				imageUrl: imageUrl,
			}
		},
		methods: {
			async userDetail() {
				const token = uni.getStorageSync('token')
				// 如果没有token，说明未登录，直接返回
				if (!token) {
					this.userInfo = null
					return
				}
				
				uni.showLoading({ title: '' })
				const res = await this.$wxapi.userDetail(token)
				uni.hideLoading()
				
				if (res.code == 0) {
					this.userInfo = res.data
				} else {
					// token可能过期
					this.userInfo = null
				}
			},
			goToLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				})
			},
			goToAddress() {
				uni.navigateTo({
					url: '/pages/mine/address'
				})
			},
			info() {
				uni.navigateTo({
					url: '/pages/mine/info'
				})
			},
			about() {
				uni.navigateTo({
					url: '/pages/mine/about?key=about'
				})
			},
			contactService() {
				// 确保 app.vue 里有此方法，否则建议改成具体的跳转或拨打电话逻辑
				if(getApp().contactService) {
					getApp().contactService()
				} else {
					uni.showToast({ title: '客服功能暂未开放', icon: 'none' })
				}
			},
			goToFeedback() {
				uni.navigateTo({
					url: '/pages/mine/feedback'
				})
			},
			goToDiscovery() {
				uni.navigateTo({
					url: '/pages/mine/discovery'
				})
			},
			shareQR() {
				console.log('分享二维码')
			},
			async loginOut() {
				const token = uni.getStorageSync('token')
				if (token) {
					uni.showLoading({ title: '' })
					await this.$wxapi.loginout(token)
					uni.hideLoading()
				}
				
				// 彻底清理本地登录状态
				uni.removeStorageSync('token')
				uni.removeStorageSync('uid')
				uni.removeStorageSync('mobile')
				this.userInfo = null
				
				// 提示并跳转登录页
				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				})
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/login/login'
					})
				}, 1000)
			},
		}
	}
</script>

<style lang="scss" scoped>
	.mine-page {
		background: #F2F7F9;
		min-height: 100vh;
		padding-bottom: 32rpx;
		padding-top: calc(var(--status-bar-height) + 40rpx);
		.user-info {
			position: relative;
			padding: 32rpx 28rpx 64rpx;
			background: linear-gradient(155deg, rgba(242, 247, 249, 1) 0%, rgba(242, 247, 249, 0.6) 100%);
			display: flex;
			align-items: center;

			.user-avatar {
				position: relative;
				width: 144rpx;
				height: 144rpx;
				margin-right: 32rpx;

				.avatar-bg {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					z-index: 1;
				}

				.avatar {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					z-index: 2;
					background-color: #f0f0f0;
				}
			}

			.user-details {
				flex: 1;

				.username {
					display: block;
					font-family: PingFang SC;
					font-weight: 600;
					font-size: 40rpx;
					line-height: 56rpx;
					color: #333333;
					margin-bottom: 4rpx;
				}

				.phone {
					display: block;
					font-family: PingFang SC;
					font-weight: 400;
					font-size: 24rpx;
					line-height: 34rpx;
					color: #9A9A9A;
				}
			}

			.setting-btn {
				width: 20rpx;
				height: 32rpx;
				display: flex;
				align-items: center;
				justify-content: center;

				image {
					width: 16rpx;
					height: 24rpx;
				}
			}
		}

		.menu-section {
			background: #FFFFFF;
			border-radius: 24rpx;
			margin: 32rpx 28rpx 0;
			padding: 0 32rpx;

			.menu-item {
				height: 106rpx;
				display: flex;
				align-items: center;

				.menu-icon {
					width: 44rpx;
					height: 44rpx;
					margin-right: 24rpx;

					image {
						width: 100%;
						height: 100%;
					}
				}

				.menu-title {
					flex: 1;
					font-weight: 500;
					font-size: 28rpx;
					line-height: 40rpx;
					color: #333333;
				}

				.menu-subtitle {
					font-weight: 400;
					font-size: 26rpx;
					line-height: 36rpx;
					color: #9A9A9A;
					margin-right: 16rpx;
				}

				.reward-dot {
					width: 12rpx;
					height: 12rpx;
					background: #FC5F6D;
					border-radius: 50%;
					margin-right: 16rpx;
				}

				.menu-arrow {
					width: 16rpx;
					height: 24rpx;

					image {
						width: 100%;
						height: 100%;
						opacity: 0.6;
					}
				}
			}

			.menu-divider {
				height: 2rpx;
				background: #F6F6F6;
				margin: 0 12rpx;
			}
		}
	}

	.login-out {
		padding: 32rpx;

		button {
			background-color: #48C5A8;
			color: #fff;
		}
	}

	.versionNum {
		font-size: 22rpx;
		text-align: center;
		margin-top: 32rpx;
		color: #999;
	}
</style>