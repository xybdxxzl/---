<template>
	<view class="login-container">
		<view class="logo-section">
			<image class="logo" src="/static/images/avatarUrl.png" mode="aspectFit"></image>
			<text class="app-name">望果科技</text>
		</view>
		
		<view class="form-section">
			<view class="welcome-text">欢迎使用望果科技</view>
			
			<button class="wx-login-btn" @tap="wxLogin">
				<text class="btn-text">微信一键登录</text>
			</button>
			
			<view class="tips">
				无需注册，点击即刻登录
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {} // 彻底清空了不需要的数据（如 referrer 和手机号表单）
	},
	
	methods: {
		// 1. 触发微信登录获取 code
		wxLogin() {
			uni.showLoading({
				title: '登录中...'
			});
			
			uni.login({
				provider: 'weixin',
				success: (loginRes) => {
					if (loginRes.code) {
						this.doApifmLogin(loginRes.code);
					} else {
						uni.hideLoading();
						uni.showToast({ title: '获取微信授权失败', icon: 'none' });
					}
				},
				fail: (err) => {
					uni.hideLoading();
					console.error('uni.login 失败:', err);
					uni.showToast({ title: '取消登录或授权失败', icon: 'none' });
				}
			});
		},
		
		// 2. 调用 API 工厂接口进行登录
		async doApifmLogin(code) {
			try {
				const loginResult = await this.$wxapi.login_wxapp(code);
				
				if (loginResult.code === 0) {
					uni.hideLoading();
					
					// 登录成功，仅保存最核心的 token 和 uid
					// 登录成功，使用官方方法保存 token 和 uid
					uni.setStorageSync('token', loginResult.data.token);
					uni.setStorageSync('uid', loginResult.data.uid);
					
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					});
					
					// 延迟跳转到首页
					setTimeout(() => {
						uni.reLaunch({
							url: '/pages/index/index'
						});
					}, 1500);
					
				} else if (loginResult.code === 10000) {
					// 10000 代表该微信用户未注册，走极简静默注册流程
					this.doApifmRegister(code);
				} else {
					uni.hideLoading();
					uni.showToast({
						title: loginResult.msg || '登录失败',
						icon: 'none'
					});
				}
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '网络请求失败', icon: 'none' });
			}
		},
		
		// 3. 极简静默注册逻辑（去除了 referrer）
		async doApifmRegister(code) {
			try {
				const regResult = await this.$wxapi.register_wxapp({
					code: code
				});
				
				if (regResult.code === 0) {
					// 注册成功后，重新获取 code 并走一遍登录流程
					// 注意：微信 code 只能用一次，所以必须重新调用 wxLogin 获取新 code
					this.wxLogin();
				} else {
					uni.hideLoading();
					uni.showToast({
						title: regResult.msg || '注册失败',
						icon: 'none'
					});
				}
			} catch (e) {
				uni.hideLoading();
				uni.showToast({ title: '注册请求失败', icon: 'none' });
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.login-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 0 40rpx;
	box-sizing: border-box;
}

.logo-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 150rpx;
	padding-bottom: 80rpx;
	
	.logo {
		width: 160rpx;
		height: 160rpx;
		border-radius: 30rpx;
		margin-bottom: 30rpx;
		background-color: #fff;
	}
	
	.app-name {
		font-size: 36rpx;
		color: #fff;
		font-weight: bold;
		letter-spacing: 2rpx;
	}
}

.form-section {
	background: #fff;
	border-radius: 24rpx;
	padding: 60rpx 40rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	text-align: center;
	
	.welcome-text {
		font-size: 32rpx;
		color: #333;
		font-weight: bold;
		margin-bottom: 60rpx;
	}
	
	.wx-login-btn {
		width: 100%;
		height: 96rpx;
		background: #07C160; 
		border-radius: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 30rpx;
		box-shadow: 0 8rpx 20rpx rgba(7, 193, 96, 0.3);
		
		&::after {
			border: none;
		}
		
		.btn-text {
			color: #fff;
			font-size: 32rpx;
			font-weight: 500;
		}
		
		&:active {
			background: #06ad56;
		}
	}
	
	.tips {
		font-size: 24rpx;
		color: #999;
	}
}
</style>