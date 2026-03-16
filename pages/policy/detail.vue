<template>
	<view v-if="policyDetail" class="policy-detail-page">
		
		<view class="header-section">
			<view class="header-bg"></view>
			<view class="policy-status-card">
				<view class="status-row">
					<text class="label">保单状态</text>
					<view class="status-badge" :class="policyDetail.status === 1 ? 'active' : 'expired'">
						<uni-icons :type="policyDetail.status === 1 ? 'checkbox-filled' : 'info-filled'" size="16" :color="policyDetail.status === 1 ? '#30BCB7' : '#999'"></uni-icons>
						<text>{{ policyDetail.statusText }}</text>
					</view>
				</view>
				<view class="policy-no-row">
					<text class="no">NO.{{ policyDetail.policyNo }}</text>
					<view class="copy-btn" @click="copyText(policyDetail.policyNo)">复制</view>
				</view>
				<view class="date-range">
					<text>保障期限：{{ policyDetail.startDate }} 至 {{ policyDetail.endDate }}</text>
				</view>
			</view>
		</view>

		<view class="info-card">
			<view class="card-title">
				<view class="decor"></view>
				<text>承保标的信息</text>
			</view>
			<view class="info-grid">
				<view class="info-row">
					<text class="label">标的名称</text>
					<text class="value">{{ policyDetail.cropName }}</text>
				</view>
				<view class="info-row">
					<text class="label">承保面积</text>
					<text class="value">{{ policyDetail.area }} 亩</text>
				</view>
				<view class="info-row">
					<text class="label">单位保额</text>
					<text class="value">¥{{ policyDetail.unitAmount }}/亩</text>
				</view>
				<view class="info-row">
					<text class="label">总保额</text>
					<text class="value highlight">¥{{ policyDetail.totalAmount }}</text>
				</view>
				<view class="divider"></view>
				<view class="info-row vertical">
					<text class="label">承保地块地址</text>
					<view class="address-box" @click="openLocation">
						<text class="addr-text">{{ policyDetail.address }}</text>
						<uni-icons type="location-filled" size="18" color="#30BCB7"></uni-icons>
					</view>
				</view>
			</view>
		</view>

		<view class="info-card">
			<view class="card-title">
				<view class="decor"></view>
				<text>投保人信息</text>
			</view>
			<view class="info-grid">
				<view class="info-row">
					<text class="label">被保险人</text>
					<text class="value">{{ policyDetail.farmerName }}</text>
				</view>
				<view class="info-row">
					<text class="label">身份证号</text>
					<text class="value">{{ policyDetail.idCard }}</text>
				</view>
				<view class="info-row">
					<text class="label">联系电话</text>
					<text class="value">{{ policyDetail.mobile }}</text>
				</view>
			</view>
		</view>

		<view class="info-card">
			<view class="card-title">
				<view class="decor"></view>
				<text>验标存档影像</text>
				<text class="sub-title">(2025.12.01 承保时拍摄)</text>
			</view>
			<view class="images-grid">
				<view 
					class="image-item" 
					v-for="(img, index) in archiveImages" 
					:key="index"
				>
					<image 
						:src="img" 
						class="detail-image" 
						mode="aspectFill" 
						@click="previewImage(index)"
					></image>
				</view>
			</view>
			<view class="tips">
				<uni-icons type="info" size="14" color="#999"></uni-icons>
				<text>以上照片将作为灾后定损的"灾前基准"进行AI比对。</text>
			</view>
		</view>

		<view class="bottom-bar safe-area-bottom">
			<view class="action-btn secondary" @click="downloadPolicy">
				<uni-icons type="download" size="16" color="#666"></uni-icons>
				<text>电子保单</text>
			</view>
			<view 
				v-if="policyDetail.status === 1" 
				class="action-btn primary" 
				@click="handleReport"
			>
				<uni-icons type="notification-filled" size="16" color="#fff"></uni-icons>
				<text>发起理赔报案</text>
			</view>
			<view 
				v-else 
				class="action-btn disabled"
			>
				<text>保单已失效</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				policyId: '',
				policyDetail: null,
				archiveImages: [] // 验标存档照片
			}
		},
		onLoad(options) {
			if (options.id) {
				this.policyId = options.id;
				this.getPolicyDetail();
			}
		},
		methods: {
			/**
			 * 模拟获取保单详情
			 */
			getPolicyDetail() {
				uni.showLoading({ title: '加载中...' });
				
				setTimeout(() => {
					// 模拟数据
					this.policyDetail = {
						id: this.policyId,
						policyNo: 'POL202605120088',
						status: 1, // 1: 保障中
						statusText: '保障中',
						startDate: '2026-01-01 00:00:00',
						endDate: '2026-12-31 23:59:59',
						
						cropName: '优质冬小麦',
						area: '120.5',
						unitAmount: '1000',
						totalAmount: '120,500',
						address: '烟台市牟平区高陵镇三村2号地块',
						latitude: 37.3833, // 模拟坐标
						longitude: 121.5833,
						
						farmerName: '张建国',
						idCard: '3706**********1234',
						mobile: '138****8888'
					};
					
					// 模拟验标照片 (健康农作物)
					this.archiveImages = [
						'https://via.placeholder.com/300x300/2ecc71/ffffff?text=Archive+IMG+1',
						'https://via.placeholder.com/300x300/27ae60/ffffff?text=Archive+IMG+2',
						'https://via.placeholder.com/300x300/2ecc71/ffffff?text=GIS+Map'
					];
					
					uni.hideLoading();
				}, 600);
			},
			
			/**
			 * 复制保单号
			 */
			copyText(text) {
				uni.setClipboardData({
					data: text,
					success: () => {
						uni.showToast({ title: '已复制' });
					}
				});
			},

			/**
			 * 预览图片
			 */
			previewImage(current) {
				uni.previewImage({
					current: this.archiveImages[current],
					urls: this.archiveImages
				});
			},

			/**
			 * 查看地块位置
			 */
			openLocation() {
				if(!this.policyDetail.latitude) return;
				uni.openLocation({
					latitude: this.policyDetail.latitude,
					longitude: this.policyDetail.longitude,
					name: this.policyDetail.address,
					address: '承保农田地块中心点'
				});
			},
			
			/**
			 * 下载电子保单
			 */
			downloadPolicy() {
				uni.showToast({
					title: '电子保单已发送至邮箱',
					icon: 'success'
				});
			},

			/**
			 * 核心功能：跳转去报案
			 */
			handleReport() {
				uni.navigateTo({
					url: `/pages/claims/apply?policyId=${this.policyId}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.policy-detail-page {
		min-height: 100vh;
		background: #F5F7FA;
		padding-bottom: 140rpx;
	}
	
	/* 1. 头部区域 */
	.header-section {
		position: relative;
		padding: 0 24rpx;
		padding-top: 20rpx;
		margin-bottom: 24rpx;
		
		.header-bg {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 300rpx;
			background: linear-gradient(180deg, #30BCB7 0%, #F5F7FA 100%);
			z-index: 0;
		}
		
		.policy-status-card {
			position: relative;
			z-index: 1;
			background: #FFFFFF;
			border-radius: 20rpx;
			padding: 32rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
			
			.status-row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 24rpx;
				
				.label { font-size: 28rpx; color: #666; }
				.status-badge {
					display: flex;
					align-items: center;
					gap: 8rpx;
					font-size: 32rpx;
					font-weight: 600;
					
					&.active { color: #30BCB7; }
					&.expired { color: #999; }
				}
			}
			
			.policy-no-row {
				display: flex;
				align-items: center;
				gap: 16rpx;
				margin-bottom: 16rpx;
				
				.no { font-size: 36rpx; font-weight: 700; color: #333; font-family: monospace; }
				.copy-btn {
					font-size: 20rpx;
					border: 1rpx solid #CCC;
					padding: 2rpx 12rpx;
					border-radius: 20rpx;
					color: #999;
				}
			}
			
			.date-range {
				font-size: 24rpx;
				color: #999;
				background: #F8F9FA;
				padding: 12rpx;
				border-radius: 8rpx;
			}
		}
	}
	
	/* 通用信息卡片 */
	.info-card {
		margin: 0 24rpx 24rpx;
		background: #FFFFFF;
		border-radius: 20rpx;
		padding: 32rpx;
		
		.card-title {
			display: flex;
			align-items: center;
			margin-bottom: 24rpx;
			
			.decor {
				width: 6rpx;
				height: 28rpx;
				background: #30BCB7;
				border-radius: 3rpx;
				margin-right: 16rpx;
			}
			text { font-size: 30rpx; font-weight: 600; color: #333; }
			.sub-title { font-size: 22rpx; color: #999; font-weight: normal; margin-left: 12rpx; }
		}
		
		.info-grid {
			.info-row {
				display: flex;
				justify-content: space-between;
				margin-bottom: 20rpx;
				font-size: 28rpx;
				
				&:last-child { margin-bottom: 0; }
				
				.label { color: #999; }
				.value { 
					color: #333; font-weight: 500; 
					&.highlight { color: #FF4D4F; font-weight: 700; font-size: 32rpx; }
				}
				
				&.vertical {
					flex-direction: column;
					gap: 12rpx;
				}
				
				.address-box {
					display: flex;
					align-items: center;
					justify-content: space-between;
					background: #F8F9FA;
					padding: 20rpx;
					border-radius: 12rpx;
					
					.addr-text { flex: 1; color: #333; font-size: 26rpx; line-height: 1.4; margin-right: 16rpx; }
				}
			}
			
			.divider { height: 1rpx; background: #F0F0F0; margin: 24rpx 0; }
		}
		
		.images-grid {
			display: flex;
			gap: 20rpx;
			margin-bottom: 16rpx;
			
			.image-item {
				width: 200rpx;
				height: 200rpx;
				border-radius: 12rpx;
				overflow: hidden;
				
				.detail-image { width: 100%; height: 100%; }
			}
		}
		
		.tips {
			display: flex;
			align-items: center;
			gap: 8rpx;
			text { font-size: 22rpx; color: #999; }
		}
	}
	
	/* 底部操作栏 */
	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #FFFFFF;
		padding: 24rpx 32rpx;
		box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
		display: flex;
		gap: 24rpx;
		z-index: 100;
		
		.action-btn {
			flex: 1;
			height: 88rpx;
			border-radius: 44rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8rpx;
			font-size: 30rpx;
			font-weight: 600;
			
			&.secondary {
				background: #F5F7FA;
				color: #666;
			}
			
			&.primary {
				background: linear-gradient(135deg, #30BCB7, #25a5a0);
				color: #FFFFFF;
				box-shadow: 0 8rpx 20rpx rgba(48, 188, 183, 0.3);
			}
			
			&.disabled {
				background: #EEE;
				color: #AAA;
			}
		}
	}
	
	.safe-area-bottom {
		padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
	}
</style>