<template>
	<view v-if="userInfo && userInfo.base" class="info">

		<view class="avatar-section">
			<view class="avatar-container">
				<image :src="userInfo.base.avatarUrl || '/static/images/avatarUrl.png'" class="avatar"
					mode="aspectFill"></image>
				<view class="camera-icon">
					<uni-icons type="camera" size="48rpx" color="#fff"></uni-icons>
				</view>
				<button class="btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar"></button>
				<button class="btn" @click="changeAvatar"></button>
				</view>
		</view>

		<view class="form-section">
			<view class="form-item">
				<text class="label">昵称</text>
				<view class="input-container">
					<input type="nickname" :value="userInfo.base.nick" class="input" placeholder="请输入昵称"
						@confirm="editNick" @blur="editNick" />
				</view>
			</view>

			<view class="form-row">
				<view class="form-item half">
					<text class="label">生日</text>
					<view class="input-container">
						<uni-datetime-picker class="input" type="date" return-type="string" @change="editBirthday">
							<input type="text" class="input" :value="userInfo.base.birthday || '请选择'" disabled />
						</uni-datetime-picker>
						<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
					</view>
				</view>
				<view class="form-item half">
					<text class="label">性别</text>
					<view class="input-container" @click="editGender">
						<input type="text" class="input" disabled :value="userInfo.base.genderStr || '请选择'" />
						<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
					</view>
				</view>
			</view>

			<view class="form-item">
				<text class="label">绑定手机</text>
				<view class="input-container">
					<input type="text" :value="userInfo.base.mobile || '还未绑定'" class="input" disabled />
					<uni-icons type="right" size="32rpx" color="#999"></uni-icons>
					<button class="btn" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber"></button>
				</view>
			</view>
			</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: null
			}
		},

		onShow() {
			// 每次显示页面时，重新拉取最新的用户信息
			this.getUserDetail()
		},

		methods: {
			// 获取用户真实详情
			async getUserDetail() {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				uni.showLoading({ title: '加载中' })
				const res = await this.$wxapi.userDetail(token)
				uni.hideLoading()
				
				if (res.code == 0) {
					this.userInfo = res.data
				}
			},

			// 统一提交修改信息
			async modifyUserInfoV2(postData) {
				const token = uni.getStorageSync('token')
				postData.token = token
				
				uni.showLoading({ title: '保存中...' })
				const res = await this.$wxapi.modifyUserInfoV2(postData)
				uni.hideLoading()
				
				if (res.code != 0) {
					uni.showToast({ title: res.msg, icon: 'none' })
					return
				}
				uni.showToast({ title: '设置成功' })
				
				// 保存成功后刷新本地页面数据
				this.getUserDetail()
			},

			// 微信小程序端更换头像
			async onChooseAvatar(e) {
				const avatarUrl = e.detail.avatarUrl
				const token = uni.getStorageSync('token')
				
				uni.showLoading({ title: '上传中...' })
				let res = await this.$wxapi.uploadFileV2(token, avatarUrl)
				uni.hideLoading()
				
				if (res.code != 0) {
					uni.showToast({ title: res.msg, icon: 'none' })
					return
				}
				this.modifyUserInfoV2({
					avatarUrl: res.data.url,
				})
			},

			// 非小程序端（H5/App）更换头像
			changeAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: async (res) => {
						const tempFilePath = res.tempFilePaths[0]
						const token = uni.getStorageSync('token')
						
						uni.showLoading({ title: '上传中...' })
						let uploadRes = await this.$wxapi.uploadFileV2(token, tempFilePath)
						uni.hideLoading()
						
						if (uploadRes.code != 0) {
							uni.showToast({ title: uploadRes.msg, icon: 'none' })
							return
						}
						this.modifyUserInfoV2({
							avatarUrl: uploadRes.data.url,
						})
					}
				});
			},

			async editNick(e) {
				if (!e.detail.value) {
					return // 如果为空则不触发保存
				}
				// 避免重复提交相同的值
				if (e.detail.value === this.userInfo.base.nick) {
					return
				}
				this.modifyUserInfoV2({
					nick: e.detail.value,
				})
			},

			async editBirthday(birthday) {
				this.modifyUserInfoV2({
					birthday,
				})
			},

			editGender() {
				uni.showActionSheet({
					itemList: ['未知', '男', '女'],
					success: async (res2) => {
						this.modifyUserInfoV2({
							gender: res2.tapIndex,
						})
					}
				});
			},

			async getPhoneNumber(e) {
				if (e.detail.errMsg.indexOf('privacy permission is not authorized') != -1) {
					uni.showModal({
						content: '请阅读并同意隐私条款以后才能继续本操作',
						confirmText: '阅读协议',
						cancelText: '取消',
						success(res) {
							if (res.confirm) {
								uni.requirePrivacyAuthorize() // 弹出用户隐私授权框
							}
						}
					})
					return
				}
				if (!e.detail.errMsg || e.detail.errMsg == "getPhoneNumber:fail user deny") {
					return
				}
				if (e.detail.errMsg != "getPhoneNumber:ok") {
					uni.showModal({ content: e.detail.errMsg, showCancel: false })
					return;
				}
				this._getPhoneNumber(e)
			},

			async _getPhoneNumber(e) {
				const token = uni.getStorageSync('token')
				const res = await this.$wxapi.bindMobileWxappV2(token, e.detail.code)
				if (res.code == 0) {
					uni.showToast({ title: '绑定成功' })
					this.getUserDetail()
				} else {
					uni.showModal({ content: res.msg, showCancel: false })
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.info {
		background-color: #ffffff;
		min-height: 100vh;

		.avatar-section {
			display: flex;
			justify-content: center;
			margin-top: 50rpx;
			margin-bottom: 60rpx;

			.avatar-container {
				position: relative;
				width: 200rpx;
				height: 200rpx;

				.btn {
					position: absolute;
					height: 100%;
					width: 100%;
					left: 0;
					top: 0;
					opacity: 0;
					z-index: 99;
				}

				.avatar {
					width: 200rpx;
					height: 200rpx;
					border-radius: 50%;
				}

				.camera-icon {
					position: absolute;
					bottom: 0;
					right: 8rpx;
					width: 68rpx;
					height: 68rpx;
					background: linear-gradient(-39deg, rgba(112, 223, 197, 1) 0%, rgba(72, 197, 168, 1) 100%);
					border-radius: 50%;
					border: 4rpx solid #ffffff;
					display: flex;
					align-items: center;
					justify-content: center;

					.camera {
						width: 36rpx;
						height: 36rpx;
					}
				}
			}
		}

		.form-section {
			padding: 0 28rpx;

			.form-row {
				display: flex;
				gap: 22rpx;
			}

			.form-item {
				margin-bottom: 46rpx;

				&.half {
					flex: 1;
				}

				.label {
					display: block;
					font-family: PingFang SC;
					font-weight: 400;
					font-size: 24rpx;
					line-height: 34rpx;
					color: #9A9A9A;
					margin-bottom: 12rpx;
				}

				.input-container {
					position: relative;
					background-color: #F2F7F9;
					border-radius: 16rpx;
					height: 92rpx;
					display: flex;
					align-items: center;
					padding: 0 32rpx;
					padding-right: 56rpx;

					.input {
						flex: 1;
						font-family: PingFang SC;
						font-weight: 500;
						font-size: 28rpx;
						line-height: 40rpx;
						color: #333333;
						background: transparent;
						border: none;
					}

					.arrow-icon {
						position: absolute;
						right: 24rpx;
						top: 50%;
						transform: translateY(-50%);
						width: 22rpx;
						height: 16rpx;
					}
					.btn {
						position: absolute;
						height: 100%;
						width: 100%;
						left: 0;
						top: 0;
						opacity: 0;
						z-index: 99;
					}
				}
			}
		}
	}
</style>