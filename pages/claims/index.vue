<template>
	<view class="claims-list-page">
		<view class="tabs-container">
			<uni-segmented-control
				:current="tabIndex" 
				:values="tabs"
				@clickItem="tabClick" 
				styleType="text"
				activeColor="#3ED09F"
			></uni-segmented-control>
		</view>

		<view class="list-container">
			<view v-if="loading === false && claimList.length === 0" class="empty-state">
				<text>暂无相关理赔单记录</text>
			</view>

			<view 
				class="claim-card" 
				v-for="(item, index) in claimList" 
				:key="item.id"
				@click="goToDetail(item)"
			>
				<view class="card-header">
					<view class="header-left">
						<uni-icons type="paperclip" size="16" color="#3ED09F"></uni-icons>
						<text class="claim-no">NO.{{ item.orderNumber || item.id }}</text>
					</view>
					<view class="status-tag" :class="getStatusClass(item.status)">
						{{ getStatusText(item.status) }}
					</view>
				</view>

				<view class="card-body">
					<view class="crop-icon-box" v-if="item.remark">
						<text class="crop-text">农</text>
					</view>
					
					<view class="info-column">
						<view class="row-main">
							<text class="crop-name">理赔申请单</text>
						</view>
						
						<view class="row-detail">
							<text class="label">预估损失：</text>
							<text class="value money">¥{{ item.amountReal || '0.00' }}</text>
						</view>
						
						<view class="row-detail">
							<text class="label">报案时间：</text>
							<text class="value date">{{ item.dateAdd || item.createTime || '--' }}</text>
						</view>
					</view>
				</view>

				<view class="card-footer">
					<view class="tips-box">
						<uni-icons v-if="item.status === 2" type="info" size="14" color="#FF4D4F"></uni-icons>
						<text v-if="item.status === 2" class="tips-text rejected">请根据驳回原因修改后重新提交</text>
						<text v-else class="tips-text">核验进度实时更新中</text>
					</view>
					
					<view class="btn-group">
						<button class="btn plain" @click.stop="goToDetail(item)">查看详情</button>
					</view>
				</view>
			</view>
		</view>
		
		<view class="loading-more" v-if="claimList.length > 0">
			<text>{{ loading ? '加载中...' : (hasMore ? '上拉加载更多' : '- 到底了 -') }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				tabIndex: 0,
				// Tabs 对应状态：全部, 待核验(0), 核验通过(1), 核验驳回(2)
				tabs: ['全部', '待核验', '已通过', '已驳回'],
				claimList: [],
				loading: true,
				hasMore: true, // 是否还有更多数据
				page: 1,       // 当前页码
				pageSize: 10   // 每页请求数量
			}
		},
		
		onLoad() {
			this.getListData();
		},
		
		async onPullDownRefresh() {
			this.page = 1; 
			this.hasMore = true;
			await this.getListData(); 
			uni.stopPullDownRefresh(); 
		},

		onReachBottom() {
			if (this.hasMore && !this.loading) {
				this.page++;
				this.getListData();
			}
		},
		
		methods: {
			tabClick(e) {
				if (this.tabIndex !== e.currentIndex) {
					this.tabIndex = e.currentIndex;
					this.page = 1;
					this.hasMore = true;
					this.claimList = [];
					this.getListData();
				}
			},

			async getListData() {
				this.loading = true;
				
				try {
					let currentStatus = '';
					if (this.tabIndex === 1) currentStatus = 0;
					if (this.tabIndex === 2) currentStatus = 1;
					if (this.tabIndex === 3) currentStatus = 2;

					// 换成真正的 API工厂 订单列表接口参数
					const params = {
						token: this.token,       // 必须传 token
						page: this.page,
						pageSize: this.pageSize, // API工厂使用 pageSize
						status: currentStatus
					};

					// 调用真实的订单列表接口
					const res = await this.$wxapi.orderList(params);
					
					// 打印后端返回的数据，方便我们看字段结构
					console.log('后端返回的列表数据：', res);

					// API工厂的订单数据通常存放在 res.data.orderList 中
					let fetchList = [];
					if (res.code === 0 && res.data) {
						fetchList = res.data.orderList || res.data || [];
					}

					if (this.page === 1) {
						this.claimList = fetchList;
					} else {
						this.claimList = [...this.claimList, ...fetchList];
					}

					if (fetchList.length < this.pageSize) {
						this.hasMore = false;
					} else {
						this.hasMore = true;
					}

				} catch (error) {
					console.error('获取理赔列表失败:', error);
					uni.showToast({
						title: '获取数据失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},

			getStatusClass(status) {
				if (status === 0) return 'pending';  
				if (status === 1) return 'approved'; 
				if (status === 2) return 'rejected'; 
				return '';
			},

			getStatusText(status) {
				const statusMap = {
					0: '待核验',
					1: '核验通过',
					2: '已驳回'
				};
				return statusMap[status] || '未知状态';
			},

			goToDetail(item) {
				// 打印当前点击项，确认 ID 字段
				console.log('当前点击的列表项数据：', item);
				
				// API工厂的订单ID字段通常是 id，有时展示用 orderNumber
				const realId = item.id || item.orderNumber;
				
				if (!realId) {
					uni.showToast({ title: '当前项缺少有效的ID字段', icon: 'none' });
					return;
				}
			
				// 携带真实有效的 id 跳转到详情页
				uni.navigateTo({
					url: `/pages/claims/detail?id=${realId}`
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	.claims-list-page {
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
		}

		.claim-card {
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
					.claim-no {
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
					
					&.pending { background: #F4F4F5; color: #909399; border: 1rpx solid #E9E9EB; }
					&.approved { background: #E8F8F2; color: #3ED09F; border: 1rpx solid rgba(62, 208, 159, 0.2); }
					&.rejected { background: #FEF0F0; color: #F56C6C; border: 1rpx solid rgba(245, 108, 108, 0.2); }
				}
			}

			.card-body {
				padding: 32rpx 24rpx;
				display: flex;
				
				.crop-icon-box {
					width: 80rpx;
					height: 80rpx;
					background: linear-gradient(135deg, #3ED09F, #2BB586);
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
						
						.crop-name { font-size: 32rpx; font-weight: 600; color: #333; }
					}
					
					.row-detail {
						display: flex;
						align-items: center;
						margin-bottom: 8rpx;
						font-size: 26rpx;
						line-height: 1.4;
						
						.label { color: #999; width: 140rpx; }
						.value {
							color: #666; flex: 1;
							&.money { color: #FF4D4F; font-weight: 500; }
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
					.tips-text { font-size: 22rpx; color: #909399; &.rejected { color: #F56C6C; } }
				}

				.btn-group {
					display: flex;
					gap: 16rpx;
					
					.btn {
						margin: 0; height: 56rpx; line-height: 54rpx; font-size: 24rpx; border-radius: 28rpx; padding: 0 24rpx;
						&.plain { background: #FFF; border: 1rpx solid #DCDFE6; color: #606266; }
					}
				}
			}
		}
	}
	
	.loading-more { text-align: center; padding: 20rpx; color: #ccc; font-size: 24rpx; }
</style>