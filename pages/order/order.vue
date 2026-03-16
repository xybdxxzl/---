<template>
	<view class="claim-page">
		<uni-segmented-control
			:current="tabIndex" :values="tabs"
			@clickItem="tabClick" styleType="text"
			activeColor="#2979FF"
		></uni-segmented-control>

		<view class="claim-list">
			<page-box-empty v-if="!list || list.length == 0" title="暂无查勘记录"></page-box-empty>
			<view v-else>
				<view v-for="(order, orderIndex) in list" :key="order.id" class="claim-card" @click="navigateTo('/pages/order/detail?id=' + order.id)">
					<view class="card-header">
						<text class="time-label">报案时间：{{ order.dateAdd }}</text>
						<view class="status-badge" :class="getStatusClass(order.status)">
							<text class="status-text">{{ getStatusText(order.status) }}</text>
						</view>
					</view>

					<view class="card-content">
						<view v-if="order.type2 == '定损点定损'" class="location-box shop">
							<view class="info-col">
								<view class="shop-name">{{ order.shopNameZt || '指定定损中心' }}</view>
								<view class="contact-row">
									<text class="label">联系电话：</text>
									<text class="val">{{ order.shopInfo.linkPhone }}</text>
								</view>
							</view>
							<view class="action-icons">
								<image class="icon" src="/static/images/tel.png" mode="widthFix" @click.stop="makeCall(order.shopInfo.linkPhone)"></image>
								<image class="icon" src="/static/images/pos.png" mode="widthFix" @click.stop="openLocation(order.shopInfo)"></image>
							</view>
						</view>
						
						<view class="service-type-row">
							<view class="type-tag" :class="getTypeClass(order.type2)">{{ order.type2 || '现场查勘' }}</view>
							<view v-if="order.type2 == '预约察勘查勘'" class="appoint-time">
								<text class="iconfont icon-time"></text>
								<text class="time-val">预约察勘：{{ order.day + ' ' + order.time }}</text>
							</view>
						</view>
						

						<view class="evidence-section">
							<view class="thumb-box">
								<image :src="order.extJson['image_1'] || '/static/images/default_car.png'" mode="aspectFill"></image>
								<view class="pic-count">共{{ order.picNumber }}张</view>
							</view>
							
							<view class="detail-list">
								<view class="d-item">
									<text class="d-label">受损标的：</text>
									<text class="d-value highlight">
										<template v-for="(g, index) in order.goods">{{ index > 0 ? '、' : '' }}{{ g.goodsName }}</template>
									</text>
								</view>
								<view class="d-item">
									<text class="d-label">预估损失：</text>
									<text class="d-value price">¥ {{ order.extJson['预估金额'] || order.amount || '待核定' }}</text>
								</view>
								<view class="d-item">
									<text class="d-label">出险描述：</text>
									<text class="d-value sub-text">{{ order.extJson['出险描述'] || '暂无详细描述' }}</text>
								</view>
							</view>
						</view>
						

						<view class="card-footer">
							<view class="address-row" v-if="order.logistics">
								<text class="addr-icon">📍</text>
								<text class="addr-text">{{ order.logistics.address }}</text>
							</view>
							
							<view v-if="order.status == 0" class="btn-group">
								<view class="action-btn cancel" @click.stop="cancelOrder(orderIndex, order)">
									<text>撤销报案</text>
								</view>
								<view class="action-btn primary" @click.stop="contactInspector(order)">
									<text>催促查勘</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				page: 1,
				tabIndex: 0,
				// 术语变更为保险相关
				tabs: ['全部', '待查勘', '定损中', '已结案', '已撤销'], 
				list: [],
				currentTab: 0, 
			}
		},
		onLoad() {
			this.getOrderList()
		},
		onReachBottom() {
			this.page++
			this.getOrderList()
		},
		onPullDownRefresh() {
			uni.stopPullDownRefresh()
			this.page=1
			this.getOrderList()
		},
		methods: {
			tabClick(e) {
				this.tabIndex = e.currentIndex
				this.page = 1
				this.getOrderList()
			},
			/**
			 * 获取案件列表
			 */
			async getOrderList() {
				uni.showLoading({
					title: '加载案件中...'
				})
				const postData = {
					token: this.token,
					page: this.page,
					showExtJson: true,
					showShopInfo: true,
					//type: 7, // 假设 type 7 是车险/财险业务线
				}
				// 状态映射调整
				if (this.tabIndex == 1) {
					postData.status = 0 // 待查勘
				} else if (this.tabIndex == 2) {
					postData.status = 1 // 定损中/维修中
				} else if (this.tabIndex == 3) {
					postData.statusBatch = '3,4' // 已结案/已赔付
				} else if (this.tabIndex == 4) {
					postData.status = -1 // 已撤销
				}
				const res = await this.$wxapi.orderList(postData)
				uni.hideLoading()
				if (res.code == 0) {
					res.data.orderList.forEach(order => {
						order.goods = res.data.goodsMap[order.id]
						order.extJson = res.data.extJsonMap[order.id]
						// 计算照片数量逻辑保持不变，这是通用的
						if(order.extJson) {
							let picNumber = 0
							Object.keys(order.extJson).forEach(key => {
								if(key.indexOf('image_') == 0) {
									const num = Number(key.split('_')[1])
									if(picNumber < num) {
										picNumber = num
									}
								}
							})
							order.picNumber = picNumber
						}
						order.logistics = res.data.logisticsMap[order.id]
						order.shopInfo = res.data.shopMap[order.shopIdZt]
					})
					if (this.page == 1) {
						this.list = res.data.orderList
					} else {
						this.list = this.list.concat(res.data.orderList)
					}
				} else {
					if (this.page == 1) {
						this.list = null
					}
				}
			},

			/**
			 * 获取案件状态样式类
			 */
			getStatusClass(status) {
				const statusMap = {
					'0': 'st-pending',    // 待查勘 (原派单中)
					'1': 'st-assessing',  // 定损中 (原进行中)
					'2': 'st-repairing',  // 维修中/审核中
					'3': 'st-closed',     // 已结案
					'4': 'st-closed',     // 已赔付
					'-1': 'st-cancelled'  // 已撤销
				}
				return statusMap[status] || 'st-default'
			},

			/**
			 * 获取案件状态文本
			 */
			getStatusText(status) {
				const statusMap = {
					'0': '待查勘',
					'1': '定损中',
					'2': '核赔中',
					'3': '已结案',
					'4': '已赔付',
					'-1': '已撤销'
				}
				return statusMap[status] || '处理中'
			},
			
			/**
			 * 获取业务类型标签样式
			 */
			getTypeClass(typeStr) {
				if(typeStr === '定损点定损') return 'tag-blue';
				if(typeStr === '预约察勘查勘') return 'tag-orange';
				return 'tag-default';
			},

			/**
			 * 联系定损点/修理厂
			 */
			makeCall(phoneNumber) {
				if(!phoneNumber) return;
				uni.makePhoneCall({
					phoneNumber
				})
			},
			
			/**
			 * 联系查勘员 (新增模拟方法)
			 */
			contactInspector(order) {
				uni.showToast({
					title: '已通知查勘员',
					icon: 'success'
				})
			},

			openLocation(shopInfo) {
				if(!shopInfo) return;
				uni.openLocation({
					name: shopInfo.name,
					address: shopInfo.address,
					latitude: shopInfo.latitude,
					longitude: shopInfo.longitude,
				})
			},
			
			/**
			 * 撤销报案
			 */
			cancelOrder(orderIndex, order) {
				uni.showModal({
					title: '温馨提示',
					content: '确定要撤销本次报案吗？撤销后将无法恢复。',
					confirmColor: '#2979FF',
					success: async (res1) => {
						if (res1.confirm) {
							uni.showLoading({
								title: '处理中'
							})
							const res = await this.$wxapi.orderCloseV2({
							  token: this.token, 
							  orderId: order.id
							})
							uni.hideLoading()
							if (res.code != 0) {
								uni.showToast({
									title: res.msg,
									icon: 'none'
								})
							} else {
								order.status = -1
								this.list.splice(orderIndex, 1, order)
								uni.showToast({
									title: '已撤销',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			navigateTo(url) {
				uni.navigateTo({
					url
				})
			},
		}
	}
</script>

<style lang="scss" scoped>
	// 变量定义 - 商务蓝风格
	$primary-blue: #2979FF;
	$success-green: #19BE6B;
	$warning-orange: #FF9900;
	$text-main: #303133;
	$text-sub: #606266;
	$text-light: #909399;
	$bg-page: #F5F7FA;
	$border-color: #EBEEF5;

	.claim-page {
		min-height: 100vh;
		background-color: $bg-page;
		padding-bottom: 30rpx;

		// 列表容器
		.claim-list {
			margin-top: 24rpx;
			padding: 0 24rpx;

			.claim-card {
				background-color: #FFFFFF;
				border-radius: 16rpx;
				margin-bottom: 24rpx;
				box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
				overflow: hidden;

				// 1. 头部
				.card-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 24rpx 24rpx;
					border-bottom: 1rpx solid $border-color;

					.time-label {
						font-size: 24rpx;
						color: $text-light;
					}

					.status-badge {
						padding: 4rpx 12rpx;
						border-radius: 8rpx;
						font-size: 24rpx;
						font-weight: 500;
						
						&.st-pending { // 待查勘
							background-color: rgba($primary-blue, 0.1);
							color: $primary-blue;
						}
						&.st-assessing, &.st-repairing { // 定损中
							background-color: rgba($warning-orange, 0.1);
							color: $warning-orange;
						}
						&.st-closed { // 已结案
							background-color: rgba($success-green, 0.1);
							color: $success-green;
						}
						&.st-cancelled { // 已取消
							background-color: #F4F4F5;
							color: #909399;
						}
					}
				}

				// 2. 内容区
				.card-content {
					padding: 24rpx;

					// 定损点/修理厂信息区
					.location-box {
						background: #F9FAFB;
						border-radius: 12rpx;
						padding: 20rpx;
						margin-bottom: 20rpx;
						display: flex;
						align-items: center;
						
						.info-col {
							flex: 1;
							.shop-name {
								font-size: 28rpx;
								font-weight: bold;
								color: $text-main;
								margin-bottom: 8rpx;
							}
							.contact-row {
								font-size: 24rpx;
								color: $text-sub;
								.val { margin-left: 8rpx; }
							}
						}
						
						.action-icons {
							display: flex;
							gap: 24rpx;
							.icon {
								width: 56rpx;
								height: 56rpx;
							}
						}
					}
					
					// 类型标签行
					.service-type-row {
						display: flex;
						align-items: center;
						margin-bottom: 24rpx;
						
						.type-tag {
							font-size: 22rpx;
							padding: 6rpx 16rpx;
							border-radius: 6rpx;
							background: #E8F3FF;
							color: $primary-blue;
							
							&.tag-orange {
								background: #FFF7E6;
								color: $warning-orange;
							}
							&.tag-blue {
								background: #E8F3FF;
								color: $primary-blue;
							}
						}
						
						.appoint-time {
							margin-left: 20rpx;
							font-size: 24rpx;
							color: $text-sub;
							.time-val { margin-left: 8rpx; }
						}
					}

					// 图片与详情
					.evidence-section {
						display: flex;
						margin-bottom: 20rpx;
						
						.thumb-box {
							position: relative;
							margin-right: 24rpx;
							image {
								width: 140rpx;
								height: 140rpx;
								border-radius: 12rpx;
								background-color: #f0f0f0;
							}
							.pic-count {
								position: absolute;
								bottom: 0;
								left: 0;
								right: 0;
								background: rgba(0,0,0,0.6);
								color: #fff;
								font-size: 20rpx;
								text-align: center;
								padding: 4rpx 0;
								border-bottom-left-radius: 12rpx;
								border-bottom-right-radius: 12rpx;
							}
						}
						
						.detail-list {
							flex: 1;
							display: flex;
							flex-direction: column;
							justify-content: space-between;
							
							.d-item {
								display: flex;
								align-items: flex-start;
								line-height: 1.4;
								margin-bottom: 8rpx;
								
								.d-label {
									font-size: 24rpx;
									color: $text-light;
									width: 130rpx; 
									flex-shrink: 0;
								}
								.d-value {
									font-size: 24rpx;
									color: $text-sub;
									
									&.highlight {
										color: $text-main;
										font-weight: 500;
									}
									&.price {
										color: #FF4D4F; // 金额用红色
										font-weight: bold;
									}
									&.sub-text {
										color: $text-light;
										// 修复部分：删除了 @include，直接使用 CSS 属性
										display: -webkit-box;
										-webkit-box-orient: vertical;
										-webkit-line-clamp: 1;
										overflow: hidden;
										text-overflow: ellipsis;
										word-break: break-all;
									}
								}
							}
						}
					}

					// 底部地址与按钮
					.card-footer {
						border-top: 1rpx solid #F6F6F6;
						padding-top: 20rpx;
						
						.address-row {
							display: flex;
							align-items: center;
							margin-bottom: 20rpx;
							.addr-icon { font-size: 24rpx; margin-right: 8rpx; }
							.addr-text {
								font-size: 26rpx;
								color: $text-sub;
								flex: 1;
							}
						}

						.btn-group {
							display: flex;
							justify-content: flex-end;
							gap: 20rpx;

							.action-btn {
								min-width: 140rpx;
								height: 60rpx;
								border-radius: 30rpx;
								display: flex;
								align-items: center;
								justify-content: center;
								font-size: 26rpx;
								
								&.cancel {
									border: 1rpx solid #DCDFE6;
									color: $text-sub;
									background: #fff;
								}
								
								&.primary {
									background: $primary-blue;
									color: #fff;
									border: 1rpx solid $primary-blue;
								}
							}
						}
					}
				}
			}
		}
	}
</style>