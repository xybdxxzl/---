<template>
	<view class="apply-page">
		<view class="section-title">关联保单信息</view>
		<view class="policy-card">
			<view class="card-header">
				<text class="label">保单号</text>
				<text class="value">{{ formData.policyNo }}</text>
			</view>
			<view class="card-body">
				<view class="info-row">
					<text class="label">投保人</text>
					<text class="value">{{ formData.farmerName }}</text>
				</view>
				<view class="info-row">
					<text class="label">标的物</text>
					<text class="value">{{ formData.cropName }}</text>
				</view>
				<view class="info-row">
					<text class="label">承保地块</text>
					<text class="value address">{{ formData.address }}</text>
				</view>
				<view class="info-row">
					<text class="label">承保面积</text>
					<text class="value">{{ formData.totalArea }} 亩</text>
				</view>
			</view>
			<view class="auto-tag">
				<uni-icons type="cloud-download" size="14" color="#30BCB7"></uni-icons>
				<text>已自动关联系统存档</text>
			</view>
		</view>

		<view class="section-title">灾害报案详情</view>
		<view class="form-container">
			<view class="form-item">
				<view class="label required">灾害类型</view>
				<picker 
					mode="selector" 
					:range="disasterTypes" 
					@change="handleTypeChange"
				>
					<view class="picker-view" :class="{ 'placeholder': !formData.disasterType }">
						{{ formData.disasterType || '请选择灾害类型' }}
						<uni-icons type="right" size="14" color="#999"></uni-icons>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<view class="label required">出险时间</view>
				<picker 
					mode="date" 
					:end="today"
					@change="handleDateChange"
				>
					<view class="picker-view" :class="{ 'placeholder': !formData.accidentTime }">
						{{ formData.accidentTime || '请选择大约时间' }}
						<uni-icons type="calendar" size="14" color="#999"></uni-icons>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<view class="label">预估受灾面积 (亩)</view>
				<input 
					class="input" 
					type="digit" 
					v-model="formData.estimatedArea" 
					placeholder="选填，系统将通过遥感自动测绘"
				/>
			</view>

			<view class="form-item vertical">
				<view class="label">现场情况描述</view>
				<textarea 
					class="textarea" 
					v-model="formData.description" 
					placeholder="请简单描述灾害情况，如：连日暴雨导致农田积水严重..."
					maxlength="200"
				/>
				<text class="word-count">{{ formData.description.length }}/200</text>
			</view>
		</view>

		<view class="section-title">现场照片 (辅助证据)</view>
		<view class="upload-container">
			<view class="upload-grid">
				<view 
					class="image-item" 
					v-for="(img, index) in imageList" 
					:key="index"
				>
					<image :src="img" mode="aspectFill"></image>
					<view class="del-btn" @click="delImage(index)">
						<uni-icons type="closeempty" size="12" color="#fff"></uni-icons>
					</view>
				</view>
				<view class="upload-btn" @click="chooseImage" v-if="imageList.length < 4">
					<uni-icons type="camera-filled" size="30" color="#ccc"></uni-icons>
					<text>上传照片</text>
				</view>
			</view>
			<view class="tips">
				<uni-icons type="info" size="14" color="#FF8E53"></uni-icons>
				<text>提示：您提交后，系统将自动调度无人机/卫星进行高精度勘察，无需担心照片质量。</text>
			</view>
		</view>

		<view class="submit-bar safe-area-bottom">
			<button 
				class="submit-btn" 
				:class="{ disabled: !isFormValid }" 
				:disabled="!isFormValid"
				@click="handleSubmit"
			>
				提交报案 (自动启动定损)
			</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				today: new Date().toISOString().slice(0, 10),
				disasterTypes: ['干旱', '洪涝', '冰雹', '病虫害', '风灾', '冻害'],
				imageList: [],
				
				// 表单数据
				formData: {
					policyId: '',
					policyNo: '', // 自动拉取
					farmerName: '', // 自动拉取
					cropName: '', // 自动拉取
					address: '', // 自动拉取
					totalArea: '', // 自动拉取
					
					disasterType: '',
					accidentTime: '',
					estimatedArea: '',
					description: ''
				}
			}
		},
		
		computed: {
			isFormValid() {
				return this.formData.disasterType && this.formData.accidentTime;
			}
		},

		onLoad(options) {
			// 模拟从保单列表(pages/policy/order)传过来的 policyId
			if (options.policyId) {
				this.formData.policyId = options.policyId;
				this.fetchPolicyInfo(options.policyId);
			} else {
				// 如果没有ID，演示默认数据
				this.fetchPolicyInfo('MOCK_123');
			}
		},

		methods: {
			/**
			 * 模拟拉取保单基础信息
			 * 对应功能点：报案信息拉取
			 */
			fetchPolicyInfo(id) {
				uni.showLoading({ title: '关联保单中...' });
				setTimeout(() => {
					// 模拟后端返回数据
					this.formData.policyNo = 'POL202605120088';
					this.formData.farmerName = '张建国';
					this.formData.cropName = '优质冬小麦';
					this.formData.address = '烟台市牟平区高陵镇三村2号地块';
					this.formData.totalArea = '120.5';
					
					uni.hideLoading();
				}, 500);
			},

			handleTypeChange(e) {
				this.formData.disasterType = this.disasterTypes[e.detail.value];
			},

			handleDateChange(e) {
				this.formData.accidentTime = e.detail.value;
			},

			chooseImage() {
				uni.chooseImage({
					count: 4 - this.imageList.length,
					success: (res) => {
						this.imageList = [...this.imageList, ...res.tempFilePaths];
					}
				});
			},

			delImage(index) {
				this.imageList.splice(index, 1);
			},

			handleSubmit() {
				if (!this.isFormValid) return;

				uni.showLoading({ title: '提交中...' });
				
				// 模拟提交并触发后台自动化流程
				setTimeout(() => {
					uni.hideLoading();
					uni.showModal({
						title: '报案成功',
						content: '系统已自动触发【无人机技术勘察】任务，请留意定损进度通知。',
						showCancel: false,
						confirmText: '查看进度',
						success: () => {
							// 跳转到定损列表或详情
							uni.redirectTo({
								url: '/pages/claims/index'
							});
						}
					});
				}, 1000);
			}
		}
	}
</script>

<style lang="scss" scoped>
	.apply-page {
		min-height: 100vh;
		background: #F5F7FA;
		padding: 24rpx;
		padding-bottom: 160rpx;
	}

	.section-title {
		font-size: 28rpx;
		color: #666;
		margin: 24rpx 0 16rpx 8rpx;
		font-weight: 500;
		
		&:first-child { margin-top: 0; }
	}

	/* 保单卡片样式 */
	.policy-card {
		background: #FFFFFF;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
		position: relative;

		.card-header {
			background: linear-gradient(90deg, #F8F9FA, #FFFFFF);
			padding: 20rpx 32rpx;
			border-bottom: 1rpx solid #F0F0F0;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.label { font-size: 24rpx; color: #999; }
			.value { font-size: 28rpx; color: #333; font-family: monospace; }
		}

		.card-body {
			padding: 24rpx 32rpx;

			.info-row {
				display: flex;
				margin-bottom: 16rpx;
				&:last-child { margin-bottom: 0; }

				.label { width: 140rpx; font-size: 26rpx; color: #999; }
				.value { flex: 1; font-size: 26rpx; color: #333; font-weight: 500; }
				.address { 
					white-space: nowrap; 
					overflow: hidden; 
					text-overflow: ellipsis; 
				}
			}
		}

		.auto-tag {
			position: absolute;
			top: 0;
			right: 0;
			background: #E6F7FF;
			padding: 6rpx 16rpx;
			border-bottom-left-radius: 20rpx;
			display: flex;
			align-items: center;
			gap: 8rpx;

			text { font-size: 20rpx; color: #30BCB7; }
		}
	}

	/* 表单容器 */
	.form-container {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 0 32rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

		.form-item {
			padding: 32rpx 0;
			border-bottom: 1rpx solid #F5F5F5;
			display: flex;
			align-items: center;
			justify-content: space-between;

			&:last-child { border-bottom: none; }
			&.vertical { flex-direction: column; align-items: flex-start; }

			.label {
				font-size: 28rpx;
				color: #333;
				width: 240rpx;
				
				&.required::after {
					content: '*';
					color: #FF4D4F;
					margin-left: 4rpx;
				}
			}

			.picker-view {
				flex: 1;
				text-align: right;
				font-size: 28rpx;
				color: #333;
				display: flex;
				align-items: center;
				justify-content: flex-end;
				gap: 8rpx;

				&.placeholder { color: #CCC; }
			}

			.input {
				flex: 1;
				text-align: right;
				font-size: 28rpx;
				color: #333;
			}

			.textarea {
				width: 100%;
				height: 160rpx;
				background: #F8F9FA;
				border-radius: 12rpx;
				padding: 20rpx;
				font-size: 26rpx;
				margin-top: 16rpx;
				box-sizing: border-box;
			}

			.word-count {
				align-self: flex-end;
				font-size: 22rpx;
				color: #CCC;
				margin-top: 8rpx;
			}
		}
	}

	/* 上传区域 */
	.upload-container {
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 32rpx;

		.upload-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 24rpx;
			margin-bottom: 24rpx;

			.image-item, .upload-btn {
				width: 150rpx;
				height: 150rpx;
				border-radius: 12rpx;
				overflow: hidden;
				position: relative;
			}

			.image-item {
				image { width: 100%; height: 100%; }
				.del-btn {
					position: absolute;
					top: 0;
					right: 0;
					background: rgba(0,0,0,0.5);
					width: 40rpx;
					height: 40rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					border-bottom-left-radius: 12rpx;
				}
			}

			.upload-btn {
				background: #F8F9FA;
				border: 2rpx dashed #DDD;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				
				text { font-size: 22rpx; color: #999; margin-top: 8rpx; }
			}
		}

		.tips {
			background: #FFF7E6;
			padding: 16rpx;
			border-radius: 8rpx;
			display: flex;
			gap: 12rpx;
			
			text { font-size: 24rpx; color: #FF8E53; line-height: 1.4; flex: 1; }
		}
	}

	/* 底部提交栏 */
	.submit-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #FFFFFF;
		padding: 24rpx 32rpx;
		box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
		z-index: 100;

		.submit-btn {
			height: 88rpx;
			background: linear-gradient(135deg, #30BCB7, #25a5a0);
			border-radius: 44rpx;
			color: #FFFFFF;
			font-size: 32rpx;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
			border: none;
			box-shadow: 0 8rpx 20rpx rgba(48, 188, 183, 0.3);

			&.disabled {
				background: #E0E0E0;
				color: #FFF;
				box-shadow: none;
			}
			
			&:active { opacity: 0.9; }
		}
	}
	
	.safe-area-bottom {
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	}
</style>