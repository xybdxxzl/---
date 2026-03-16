<template>
	<view class="page">
		<view class="search-box">
			<view style="height: 64rpx;"></view>
			<custom-header></custom-header>
			<view class="search-container">
				<view class="address-input-container">
					<view class="address-input" @click="selectAddress">
						<view class="recycle-icon">
							<text class="recycle-text">验</text>
						</view>
						<text class="input-placeholder">{{ address ? address.address : '请选择验标地块位置' }}</text>
						<uni-icons type="right" size="32rpx" color="#CBCBCB"></uni-icons>
					</view>
				</view>
				<view class="serviceList">
					<view v-for="(item,index) in serviceList" :key="item" class="item">
						<uni-icons type="checkbox" size="32rpx" color="#CBCBCB"></uni-icons>
						<text>{{ item }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="container">
			<view class="form">
				<uni-forms>
					<uni-forms-item label="期望验标时间" label-width="auto" required>
						<uni-datetime-picker type="datetime" return-type="string" :start="curTime" v-model="datetime"/>
					</uni-forms-item>
					
					<view class="divider"></view>
					
					<uni-forms-item label="作物类型（单选）" label-width="auto" required></uni-forms-item>
					
					<view class="recycle-types">
						<view v-for="(item, index) in recycleTypes" :key="item.id" 
							:class="{ 'type-item': true, selected: selectedType === item.id }" 
							@click="selectType(item.id)">
							
							<text :class="{ 'type-name': true, selected: selectedType === item.id }">
								{{ item.name }}
							</text>
							
							<text :class="{ 'type-price': true, selected: selectedType === item.id }">
								保额:{{ item.minPrice }}元/亩
							</text>
						</view>
					</view>

					<uni-forms-item label="预计总量 (亩)" label-width="auto" required>
						<uni-easyinput
							type="digit"
							v-model="weight"
							placeholder="请填写种植面积，例如 10.5"
						/>
					</uni-forms-item>

					<view class="divider"></view>
					
					<uni-forms-item label="上传农村土地承包经营权证" label-width="auto" required></uni-forms-item>
					<view style="padding-bottom: 32rpx;">
						<uni-file-picker
							limit="9"
							title="最多选择9张图片"
							mode="grid"
							:auto-upload="false"
							@select="afterPicRead"
							@delete="afterPicDel"
						/>
					</view>

					<uni-forms-item label="作物描述/往年保险情况" label-width="auto" required></uni-forms-item>
					<uni-easyinput type="textarea" v-model="description" placeholder="请描述作物生长阶段、受灾情况或往年投保历史" />
				</uni-forms>
				
			</view>
		</view>

		<view class="btn">
			<button type="default" :loading="loading" @click="submit">提交验标申请</button>
		</view>
	</view>
</template>
<script>
	import dayjs from 'dayjs'
	export default {
		data() {
			return {
				// --- 新增：从缓存中读取必需的全局数据 ---
				sysconfigMap: uni.getStorageSync('sysconfigMap') || {},
				token: uni.getStorageSync('token') || '',
				uid: uni.getStorageSync('uid') || '',
				
				// --- 原有数据 ---
				address: undefined, 
				datetime: undefined, 
				description: undefined, 
				weight: undefined, 
				serviceList: [], 
				curTime: undefined,
				selectedType: null, 
				fileList: [], 
				recycleTypes: [], 
				loading: false,
			}
		},
		onLoad(e) {
			// 每次进入页面刷新一下基础数据，防止缓存未同步
			this.token = uni.getStorageSync('token') || '';
			this.uid = uni.getStorageSync('uid') || '';
			this.sysconfigMap = uni.getStorageSync('sysconfigMap') || {};
			
			this.curTime = dayjs().valueOf()
			this.initConfigData()
			this.goodsv2()
		},
		onShow() {
			const selectAddress = uni.getStorageSync('selectAddress')
			if(selectAddress) {
				this.address = selectAddress
			}
		},
		onUnload() {
			// 离开页面时移除监听，防止内存泄漏
			uni.$off('sysconfigOK')
		},
		onShareAppMessage() {
			return {
				title: (this.sysconfigMap.mallName || '回收小助手') + ' - 农业验标申请',
				path: '/pages/index/index?inviter_id=' + this.uid,
				imageUrl: this.sysconfigMap.share_pic || '',
			}
		},
		onShareTimeline() {
			return {
				title: (this.sysconfigMap.mallName || '回收小助手') + ' - 农业验标申请',
				query: 'inviter_id=' + this.uid,
				imageUrl: this.sysconfigMap.share_pic || ''
			}
		},
		methods: {
			initConfigData() {
				if(this.sysconfigMap && this.sysconfigMap.serviceList) {
					this.serviceList = this.sysconfigMap.serviceList.split(',')
				}
				// 监听系统配置加载完成事件
				uni.$on('sysconfigOK', data => {
					this.sysconfigMap = data || {}
					if(this.sysconfigMap.serviceList) {
						this.serviceList = this.sysconfigMap.serviceList.split(',')
					}
				})
			},
			async goodsv2() {
				if (!this.token) return; // 如果没有token，拦截请求
				
				const res = await this.$wxapi.goodsv2({
					token: this.token,
					categoryKey: 'recycle', 
				})
				if(res.code == 0) {
					this.recycleTypes = res.data.result
				}
			},
			
			selectType(id) {
				this.selectedType = id;
			},
			
			afterPicRead(event) {
				this.fileList = this.fileList.concat(event.tempFiles)
			},
			afterPicDel(event) {
				const index = this.fileList.findIndex(ele => ele.path == event.tempFile.path)
				this.fileList.splice(index, 1)
			},
			selectAddress() {
				uni.navigateTo({
					url: '/pages/mine/address?from=index'
				})
			},
			async submit() {
				if(!this.address) {
					uni.showToast({ title: '请选择验标地块位置', icon: 'none' })
					return
				}
				if(!this.datetime) {
					uni.showToast({ title: '请选择期望上门时间', icon: 'none' })
					return
				}
				if(!this.selectedType) {
					uni.showToast({ title: '请选择作物种类', icon: 'none' })
					return
				}
				if(!this.weight) {
					uni.showToast({ title: '请填写预计面积', icon: 'none' })
					return
				}
				if(!this.fileList || this.fileList.length == 0) {
					uni.showToast({ title: '请上传土地权证/现场照片', icon: 'none' })
					return
				}
				if(!this.description) {
					uni.showToast({ title: '请填写作物情况描述', icon: 'none' })
					return
				}
				if (!this.token) {
					uni.showToast({ title: '登录状态异常，请重新登录', icon: 'none' })
					return
				}

				uni.showLoading({ title: '提交中...' })
				this.loading = true

				const extJsonStr = {
					'申报面积(亩)': this.weight,
					'情况描述': this.description
				}
				
				if (this.fileList) {
					for (let index = 0; index < this.fileList.length; index++) {
						const pic = this.fileList[index]
						const res = await this.$wxapi.uploadFileV2(this.token, pic.path || pic.url)
						if (res.code == 0) {
							extJsonStr['image_' + (index + 1)] = res.data.url
						}
					}
				}

				const goodsJsonStr = [{
					goodsId: this.selectedType,
					number: 1
				}]
				
				const postData = {
					token: this.token,
					recycle: false, 
					type: 2, 
					goodsJsonStr: JSON.stringify(goodsJsonStr),
					extJsonStr: JSON.stringify(extJsonStr),
					remark: '验标申请: ' + this.description,
					extType: '作物验标',
					provinceId: this.address.provinceId,
					cityId: this.address.cityId,
					address: this.address.address,
					menpai: this.address.menpai,
					linkMan: this.address.linkMan,
					mobile: this.address.mobile,
					lat: this.address.latitude,
					lng: this.address.longitude,
					attendanDay: this.datetime.split(' ')[0],
					attendanTime: this.datetime.split(' ')[1]
				}

				const res = await this.$wxapi.orderCreate(postData)
				uni.hideLoading()
				this.loading = false
				
				if(res.code != 0) {
					uni.showToast({ title: res.msg, icon: 'none' })
					return
				}
				
				uni.showModal({
					title: '申请成功',
					content: '验标员将在24小时内联系您确认地块信息',
					showCancel: false,
					success: () => {
						uni.redirectTo({
							url: '/pages/order/detail?id=' + res.data.id
						})
					}
				})
			},
		}
	}
</script>

<style lang="scss" scoped>
	.page {
		width: 750rpx;
		background: #F2F7F9;
		min-height: 100vh;
	}

	.search-box {
		padding: 0 32rpx;
		background: linear-gradient(180deg, #3ED09F, #F2F7F9);
		padding-bottom: 100rpx;

		.search-container {
			margin-top: 88rpx;
			/* #ifdef H5 */
			margin-top: 32rpx;
			/* #endif */
			background: #fff;
			border-radius: 16rpx;
			padding: 32rpx;
			padding-bottom: 0;
		}
	}

	.address-input-container {
		.address-input {
			background: #F2F7F9;
			border-radius: 16rpx;
			padding: 32rpx;
			display: flex;
			align-items: center;
			gap: 24rpx;

			.recycle-icon {
				width: 40rpx;
				height: 40rpx;
				background: #48C5A8;
				border-radius: 8rpx;
				display: flex;
				align-items: center;
				justify-content: center;

				.recycle-text {
					font-weight: 400;
					font-size: 24rpx;
					color: #FFFFFF;
				}
			}

			.input-placeholder {
				flex: 1;
				font-weight: 600;
				font-size: 32rpx;
				color: #9A9A9A;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.serviceList {
		display: flex;
		padding: 32rpx;

		.item {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;

			text {
				margin-left: 8rpx;
				font-weight: 400;
				font-size: 22rpx;
				color: #9A9A9A;
			}
		}
	}

	.container {
		margin: 32rpx;
		margin-top: -64rpx;
		margin-bottom: 0;
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		
		.form {
			padding: 32rpx;
			padding-top: 48rpx;
		}
	}
	
	.recycle-types {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20rpx;
		padding-bottom: 48rpx;
	
		.type-item {
			height: 110rpx;
			border: 2rpx solid #DADADA;
			border-radius: 12rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: all 0.2s;
	
			&.selected {
				background: #48C5A8;
				border-color: #48C5A8;
				box-shadow: 0 4rpx 12rpx rgba(72, 197, 168, 0.3);
			}
	
			.type-name {
				font-weight: 500;
				font-size: 28rpx;
				color: #333333;
				margin-bottom: 6rpx;
	
				&.selected {
					color: #FFFFFF;
				}
			}
	
			.type-price {
				font-weight: 400;
				font-size: 20rpx;
				color: #9A9A9A;
	
				&.selected {
					color: #FFFFFF;
				}
			}
		}
	}
	.divider {
		width: 100%;
		height: 1rpx;
		background: #F6F6F6;
		margin-bottom: 32rpx;
	}
	.btn {
		padding: 32rpx;
		padding-bottom: 64rpx;
		button {
			background: #48C5A8;
			color: #fff;
			border-radius: 44rpx;
			font-size: 32rpx;
			font-weight: 600;
		}
	}
</style>