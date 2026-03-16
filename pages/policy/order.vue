<template>
	<view class="policy-list-page">
		<view class="tabs-container">
			<uni-segmented-control
				:current="tabIndex" 
				:values="tabs"
				@clickItem="tabClick" 
				styleType="text"
				activeColor="#30BCB7"
			></uni-segmented-control>
		</view>

		<view class="list-container">
			<view v-if="loading === false && policyList.length === 0" class="empty-state">
				<image src="/static/empty-policy.png" mode="aspectFit" class="empty-img"></image>
				<text>暂无相关保单记录</text>
			</view>

			<view 
				class="policy-card" 
				v-for="(item, index) in policyList" 
				:key="item.id"
				@click="goToDetail(item)"
			>
				<view class="card-header">
					<view class="header-left">
						<uni-icons type="paperclip" size="16" color="#30BCB7"></uni-icons>
						<text class="policy-no">NO.{{ item.policyNo }}</text>
					</view>
					<view class="status-tag" :class="getStatusClass(item.status)">
						{{ item.statusText }}
					</view>
				</view>

				<view class="card-body">
					<view class="crop-icon-box">
						<text class="crop-text">{{ item.cropName.substring(0,1) }}</text>
					</view>
					
					<view class="info-column">
						<view class="row-main">
							<text class="crop-name">{{ item.cropName }}</text>
							<text class="area-tag">{{ item.area }}亩</text>
						</view>
						
						<view class="row-detail">
							<text class="label">承保金额：</text>
							<text class="value money">¥{{ item.amount }}</text>
						</view>
						
						<view class="row-detail">
							<text class="label">承保地块：</text>
							<text class="value address">{{ item.address }}</text>
						</view>
						
						<view class="row-detail">
							<text class="label">保障期限：</text>
							<text class="value date">{{ item.startDate }} 至 {{ item.endDate }}</text>
						</view>
					</view>
				</view>

				<view class="card-footer">
					<view class="tips-box">
						<uni-icons v-if="item.status === 1" type="info" size="14" color="#FF9900"></uni-icons>
						<text v-if="item.status === 1" class="tips-text">如遇灾害，请及时报案</text>
						<text v-else class="tips-text disabled">保单已失效</text>
					</view>
					
					<view class="btn-group">
						<button class="btn plain" @click.stop="goToDetail(item)">查看详情</button>
						<button 
							v-if="item.status === 1" 
							class="btn primary" 
							@click.stop="handleReport(item)"
						>
							一键报案
						</button>
					</view>
				</view>
			</view>
		</view>
		
		<view class="loading-more" v-if="policyList.length > 0">
			<text>{{ hasMore ? '加载中...' : '- 到底了 -' }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				tabIndex: 0,
				tabs: ['全部', '保障中', '已到期', '待生效'],
				policyList: [],
				loading: true,
				hasMore: false,
				page: 1
			}
		},
		
		onLoad() {
			this.getPolicyList();
		},
		
		onPullDownRefresh() {
			this.page = 1;
			this.getPolicyList().then(() => {
				uni.stopPullDownRefresh();
			});
		},
		
		methods: {
			tabClick(e) {
				if (this.tabIndex !== e.currentIndex) {
					this.tabIndex = e.currentIndex;
					this.page = 1;
					this.policyList = [];
					this.getPolicyList();
				}
			},

			/**
			 * 模拟获取保单列表
			 */
			getPolicyList() {
				return new Promise((resolve) => {
					this.loading = true;
					setTimeout(() => {
						// 模拟后端数据
						let mockData = [
							{
								id: 'P001',
								policyNo: 'POL202605120088',
								cropName: '优质冬小麦',
								area: '120.5',
								amount: '120,500',
								address: '烟台市牟平区高陵镇三村2号地块',
								startDate: '2026-01-01',
								endDate: '2026-12-31',
								status: 1, // 1: 保障中
								statusText: '保障中'
							},
							{
								id: 'P002',
								policyNo: 'POL202506019999',
								cropName: '玉米',
								area: '50.0',
								amount: '45,000',
								address: '烟台市福山区门楼镇西区',
								startDate: '2025-06-01',
								endDate: '2025-11-30',
								status: 2, // 2: 已到期
								statusText: '已到期'
							}
						];

						// 简单的筛选逻辑
						if (this.tabIndex === 1) mockData = mockData.filter(i => i.status === 1);
						if (this.tabIndex === 2) mockData = mockData.filter(i => i.status === 2);

						if (this.page === 1) {
							this.policyList = mockData;
						} else {
							this.policyList = [...this.policyList, ...mockData];
						}
						
						this.loading = false;
						resolve();
					}, 500);
				});
			},

			getStatusClass(status) {
				// 1:保障中(绿色/主色), 2:已到期(灰色), 0:待生效(橙色)
				if (status === 1) return 'active';
				if (status === 2) return 'expired';
				return 'pending';
			},

			goToDetail(item) {
				uni.navigateTo({
					url: `/pages/policy/detail?id=${item.id}`
				});
			},

			/**
			 * 核心功能：发起报案
			 * 携带保单ID跳转到 apply 页面
			 */
			handleReport(item) {
				uni.navigateTo({
					url: `/pages/claims/apply?policyId=${item.id}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.policy-list-page {
		min-height: 100vh;
		background-color: #F5F7FA;
		padding-bottom: 40rpx;
	}

	.tabs-container {
		background: #FFFFFF;
		padding: 20rpx 0;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
	}

	.list-container {
		padding: 24rpx 32rpx;

		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding-top: 100rpx;
			color: #999;
			font-size: 26rpx;
			
			.empty-img {
				width: 240rpx;
				height: 240rpx;
				margin-bottom: 24rpx;
				opacity: 0.6;
			}
		}

		.policy-card {
			background: #FFFFFF;
			border-radius: 20rpx;
			margin-bottom: 24rpx;
			box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
			overflow: hidden;
			transition: all 0.2s;
			
			&:active {
				transform: scale(0.99);
			}

			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 24rpx;
				border-bottom: 1rpx solid #F5F7FA;

				.header-left {
					display: flex;
					align-items: center;
					gap: 8rpx;
					.policy-no {
						font-size: 28rpx;
						color: #333;
						font-weight: 500;
						font-family: monospace;
					}
				}

				.status-tag {
					font-size: 24rpx;
					padding: 4rpx 16rpx;
					border-radius: 8rpx;
					
					&.active {
						background: #E6F7FF;
						color: #30BCB7;
						border: 1rpx solid rgba(48, 188, 183, 0.2);
					}
					&.expired {
						background: #F5F5F5;
						color: #999;
					}
					&.pending {
						background: #FFF7E6;
						color: #FF9900;
					}
				}
			}

			.card-body {
				padding: 32rpx 24rpx;
				display: flex;
				
				.crop-icon-box {
					width: 80rpx;
					height: 80rpx;
					background: linear-gradient(135deg, #30BCB7, #25a5a0);
					border-radius: 12rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-right: 24rpx;
					flex-shrink: 0;
					
					.crop-text {
						font-size: 40rpx;
						color: #FFF;
						font-weight: 600;
					}
				}

				.info-column {
					flex: 1;
					
					.row-main {
						display: flex;
						align-items: center;
						justify-content: space-between;
						margin-bottom: 16rpx;
						
						.crop-name {
							font-size: 32rpx;
							font-weight: 600;
							color: #333;
						}
						.area-tag {
							font-size: 22rpx;
							background: #F0F9EB;
							color: #67C23A;
							padding: 2rpx 12rpx;
							border-radius: 4rpx;
						}
					}
					
					.row-detail {
						display: flex;
						align-items: center;
						margin-bottom: 8rpx;
						font-size: 26rpx;
						line-height: 1.4;
						
						.label {
							color: #999;
							width: 140rpx;
						}
						.value {
							color: #666;
							flex: 1;
							
							&.money { color: #FF4D4F; font-weight: 500; }
							&.address {
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
								max-width: 380rpx;
							}
						}
					}
				}
			}

			.card-footer {
				padding: 20rpx 24rpx;
				background: #FBFBFB;
				border-top: 1rpx solid #F5F5F5;
				display: flex;
				justify-content: space-between;
				align-items: center;

				.tips-box {
					display: flex;
					align-items: center;
					gap: 8rpx;
					
					.tips-text {
						font-size: 22rpx;
						color: #FF9900;
						&.disabled { color: #CCC; }
					}
				}

				.btn-group {
					display: flex;
					gap: 16rpx;
					
					.btn {
						margin: 0;
						height: 56rpx;
						line-height: 54rpx;
						font-size: 24rpx;
						border-radius: 28rpx;
						padding: 0 24rpx;
						
						&.plain {
							background: #FFF;
							border: 1rpx solid #DCDFE6;
							color: #606266;
						}
						
						&.primary {
							background: #30BCB7;
							border: 1rpx solid #30BCB7;
							color: #FFF;
							box-shadow: 0 4rpx 12rpx rgba(48, 188, 183, 0.3);
						}
					}
				}
			}
		}
	}
	
	.loading-more {
		text-align: center;
		padding: 20rpx;
		color: #ccc;
		font-size: 24rpx;
	}
</style>