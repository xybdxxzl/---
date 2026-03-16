<template>
	<view class="claim-detail-page">
		<view class="loading-state" v-if="!claimData">
			<uni-icons type="spinner-cycle" size="30" color="#30BCB7" class="spin"></uni-icons>
			<text class="loading-text">正在调取农险档案...</text>
		</view>

		<view class="main-content" v-else>
			<view class="header-card">
				<view class="status-row">
					<text class="claim-no">案件编号: {{ claimData.claimNo }}</text>
					<view class="status-badge" :class="getStatusClass(claimData.status)">
						{{ claimData.statusText }}
					</view>
				</view>
				<view class="divider"></view>
				<view class="info-grid">
					<view class="info-item">
						<text class="label">投保人</text>
						<text class="value">{{ claimData.farmerName }}</text>
					</view>
					<view class="info-item">
						<text class="label">灾害类型</text>
						<text class="value danger">{{ claimData.disasterType }}</text>
					</view>
					<view class="info-item">
						<text class="label">标的物</text>
						<text class="value">{{ claimData.cropName }}</text>
					</view>
					<view class="info-item">
						<text class="label">报案时间</text>
						<text class="value">{{ claimData.reportTime }}</text>
					</view>
				</view>
			</view>

			<view class="process-section">
				<view class="section-title">处理进度</view>
				<view class="steps-container">
					<view class="step-item" :class="{ active: currentStep >= 0 }">
						<view class="circle">1</view>
						<text>报案</text>
					</view>
					<view class="line" :class="{ active: currentStep >= 1 }"></view>
					<view class="step-item" :class="{ active: currentStep >= 1 }">
						<view class="circle">2</view>
						<text>勘察</text>
					</view>
					<view class="line" :class="{ active: currentStep >= 2 }"></view>
					<view class="step-item" :class="{ active: currentStep >= 2 }">
						<view class="circle">3</view>
						<text>核验</text>
					</view>
					<view class="line" :class="{ active: currentStep >= 3 }"></view>
					<view class="step-item" :class="{ active: currentStep >= 3 }">
						<view class="circle">4</view>
						<text>理赔</text>
					</view>
				</view>
			</view>

			<view class="contrast-section">
				<view class="section-header">
					<view class="title-box">
						<text class="title">时空影像对比</text>
						<text class="sub-title">AI 自动匹配历史地块</text>
					</view>
					<view class="contrast-switch">
						<view class="switch-item" :class="{ active: contrastMode === 'archive' }" @click="contrastMode = 'archive'">承保存档</view>
						<view class="switch-item" :class="{ active: contrastMode === 'current' }" @click="contrastMode = 'current'">灾后航拍</view>
					</view>
				</view>
				<view class="image-container">
					<image v-if="contrastMode === 'archive'" :src="claimData.archiveImage" class="contrast-image" mode="aspectFill" @click="previewImage(claimData.archiveImage)"></image>
					<image v-else :src="claimData.surveyImage" class="contrast-image" mode="aspectFill" @click="previewImage(claimData.surveyImage)"></image>
					<view class="image-overlay">
						<view class="overlay-tag">
							<uni-icons :type="contrastMode === 'archive' ? 'folder-add' : 'camera'" size="14" color="#fff"></uni-icons>
							<text>{{ contrastMode === 'archive' ? '承保存档影像' : '无人机实拍采集' }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="report-section" v-if="claimData.analysis">
				<view class="section-title">AI 定损分析报告</view>
				<view class="data-grid">
					<view class="data-card">
						<text class="num">{{ claimData.analysis.totalArea }}</text>
						<text class="unit">亩</text>
						<text class="desc">核定面积</text>
					</view>
					<view class="data-card warning">
						<text class="num">{{ claimData.analysis.lossRate }}</text>
						<text class="unit">%</text>
						<text class="desc">损失程度</text>
					</view>
					<view class="data-card danger">
						<text class="num">{{ claimData.analysis.lossAmount }}</text>
						<text class="unit">万</text>
						<text class="desc">预估赔付</text>
					</view>
				</view>
			</view>
			
			<view class="eval-result-section" v-if="evalResult">
				<view class="section-title">智能核验结论</view>
				<view class="result-card" :class="evalResult.pass ? 'pass' : 'reject'">
					<view class="result-header">
						<uni-icons :type="evalResult.pass ? 'checkbox-filled' : 'clear'" :color="evalResult.pass ? '#52C41A' : '#FF4D4F'" size="26"></uni-icons>
						<text class="result-title">{{ evalResult.pass ? '核验通过 (Yes)' : '发现异常 (No)' }}</text>
					</view>
					<view class="result-reason">
						<text class="label">判断依据：</text>
						<text class="text">{{ evalResult.reason }}</text>
					</view>
				</view>
			</view>
			
			<view class="bottom-action-bar safe-area-bottom">
				<template v-if="!evalResult">
					<button class="btn primary full-width" :loading="isEvaluating" @click="submitEvaluation">
						{{ isEvaluating ? '后端计算中...' : '开始 AI 智能核验' }}
					</button>
				</template>
				<template v-else>
					<button class="btn secondary" @click="getClaimDetail">重新加载</button>
					<button class="btn primary" :class="!evalResult.pass ? 'danger-btn' : ''" @click="confirmAssessment">
						{{ evalResult.pass ? '确认并推至理赔' : '确认并驳回案件' }}
					</button>
				</template>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				claimId: '',
				currentStep: 0, 
				contrastMode: 'current',
				isEvaluating: false,
				evalResult: null,    
				claimData: null // 处理后的页面展示数据
			}
		},
		
		onLoad(options) {
			// 获取上个页面传来的订单/理赔单 ID
			this.claimId = options.id; 
			if (this.claimId) {
				this.getClaimDetail();
			} else {
				uni.showToast({ title: '缺少案件ID', icon: 'none' });
			}
		},

		onPullDownRefresh() {
			this.evalResult = null; 
			this.getClaimDetail();
		},
		
		methods: {
			// ================= 1. 获取理赔详情 (复用 API工厂 订单接口) =================
			async getClaimDetail() {
				uni.showLoading({ title: '加载中...' });
				
				// 恢复使用你系统原装的 $wxapi 获取数据，避免“接口不存在”
				const res = await this.$wxapi.orderDetail(this.token, this.claimId);
				
				uni.hideLoading();
				uni.stopPullDownRefresh();

				if (res.code !== 0) {
					uni.showToast({ title: res.msg || '获取数据失败', icon: 'none' });
					return;
				}

				// 将后端返回的订单数据，映射成我们农险 UI 需要的格式
				const orderInfo = res.data.orderInfo || {};
				const logistics = res.data.logistics || {};
				const extJson = res.data.extJson || {};
				const goods = (res.data.goods && res.data.goods.length > 0) ? res.data.goods[0] : {};

				this.currentStep = orderInfo.status; // 同步进度条状态

				this.claimData = {
					claimNo: orderInfo.orderNumber || this.claimId,
					status: orderInfo.status,
					statusText: this.getStatusText(orderInfo.status),
					farmerName: logistics.linkMan || '未知农户',
					disasterType: extJson['灾害类型'] || '自然灾害 (默认)',
					cropName: goods.goodsName || '农作物 (默认)',
					reportTime: orderInfo.dateAdd || '--',
					
					// 如果后端 extJson 里没有图片，给一个默认的占位图防破图
					archiveImage: extJson['archiveImage'] || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop',
					surveyImage: extJson['surveyImage'] || 'https://images.unsplash.com/photo-1592982537447-6f200b3f8cb1?q=80&w=800&auto=format&fit=crop',
					
					analysis: {
						totalArea: extJson['核定面积'] || '0',
						lossRate: extJson['损失程度'] || '0',
						lossAmount: extJson['预估赔付'] || '0'
					}
				};
			},

			getStatusText(status) {
				const statusMap = {
					'0': '待勘察',
					'1': '勘察中', 
					'2': '待核验', 
					'3': '理赔中', 
					'4': '已完结', 
					'-1': '已驳回'
				}
				return statusMap[status] || '处理中'
			},

			getStatusClass(status) {
				if (status == 0 || status == 1) return 'pending';
				if (status == 2) return 'processing';
				if (status == 3) return 'analyzing';
				if (status == 4) return 'done';
				return 'pending';
			},

			// ================= 2. 模拟 AI 智能核验 =================
			submitEvaluation() {
				if (this.isEvaluating) return;
				this.isEvaluating = true;
				
				// 因为 API工厂 没有真实的 AI 接口，这里用 setTimeout 模拟 2 秒的后端计算过程
				setTimeout(() => {
					// 随机生成通过或驳回的结果（你可以改为固定 true 方便测试）
					const isPass = Math.random() > 0.3; 
					
					this.evalResult = {
						pass: isPass,
						reason: isPass ? '系统已完成现场影像与标的库比对，面积与损失率吻合。' : '警告：灾后航拍影像显示的受灾边界与承保存档地块存在严重偏差，疑似虚假报案。'
					};
					
					this.isEvaluating = false;
					uni.showToast({
						title: isPass ? '核验通过' : '发现异常',
						icon: isPass ? 'success' : 'none',
						duration: 2500
					});
				}, 2000); // 2000毫秒 = 2秒
			},

			// ================= 页面通用逻辑 =================
			previewImage(url) {
				if (!url || !this.claimData) return;
				const urls = [];
				if (this.claimData.archiveImage) urls.push(this.claimData.archiveImage);
				if (this.claimData.surveyImage) urls.push(this.claimData.surveyImage);
				
				if (urls.length > 0) {
					uni.previewImage({ urls: urls, current: url });
				}
			},

			confirmAssessment() {
				const title = this.evalResult.pass ? '确认通过' : '确认驳回';
				const content = this.evalResult.pass 
					? '确认通过该农险核验单并推送至理赔系统？'
					: '确认驳回该申请？操作后将无法修改。';
					
				uni.showModal({
					title: title,
					content: content,
					success: async (res) => {
						if(res.confirm) {
							// 真实业务中，这里调用改变订单状态的接口
							// 比如: await this.$wxapi.orderModifyStatus(this.token, this.claimId, 3)
							uni.showToast({ title: '操作已提交' });
							setTimeout(() => uni.navigateBack(), 1500);
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss" scoped>
	/* 样式与你提供的一致，保持原有美观 */
	.claim-detail-page {
		min-height: 100vh;
		background: #F5F7FA;
		padding: 24rpx;
		padding-bottom: calc(env(safe-area-inset-bottom) + 140rpx);
	}

	.loading-state {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		height: 80vh; color: #999;
		.loading-text { margin-top: 20rpx; font-size: 28rpx; }
	}
	
	.spin { animation: rotate 2s linear infinite; }
	@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

	.header-card, .process-section, .contrast-section, .report-section, .eval-result-section {
		background: #FFFFFF; border-radius: 20rpx; padding: 32rpx;
		margin-bottom: 24rpx; box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}

	.status-row {
		display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx;
		.claim-no { font-size: 28rpx; color: #999; }
		.status-badge {
			padding: 8rpx 20rpx; border-radius: 8rpx; font-size: 24rpx; font-weight: 600;
			&.pending { background: #FFF7E6; color: #FA8C16; }
			&.processing { background: #E6F7FF; color: #1890FF; }
			&.analyzing { background: #F9F0FF; color: #722ED1; }
			&.done { background: #F6FFED; color: #52C41A; }
		}
	}

	.divider { height: 1rpx; background: #F0F0F0; margin-bottom: 24rpx; }

	.info-grid {
		display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx;
		.info-item {
			display: flex; flex-direction: column;
			.label { font-size: 24rpx; color: #999; margin-bottom: 8rpx; }
			.value { font-size: 30rpx; color: #333; font-weight: 500; }
			.danger { color: #FF4D4F; }
		}
	}

	.steps-container {
		display: flex; align-items: center; justify-content: space-between; margin-top: 20rpx;
		.step-item {
			display: flex; flex-direction: column; align-items: center; color: #CCC;
			.circle {
				width: 48rpx; height: 48rpx; border-radius: 50%; background: #F0F0F0;
				display: flex; align-items: center; justify-content: center; font-size: 24rpx; margin-bottom: 12rpx;
			}
			&.active { color: #333; .circle { background: #30BCB7; color: #FFF; } }
		}
		.line { flex: 1; height: 4rpx; background: #F0F0F0; margin: 0 10rpx; margin-bottom: 30rpx; &.active { background: #30BCB7; } }
	}

	.contrast-section {
		padding: 0; overflow: hidden;
		.section-header { padding: 32rpx; display: flex; justify-content: space-between; align-items: center; }
		.title { font-size: 32rpx; font-weight: 600; }
		.sub-title { font-size: 22rpx; color: #30BCB7; display: block; }
		.contrast-switch {
			display: flex; background: #F5F7FA; border-radius: 32rpx; padding: 6rpx;
			.switch-item {
				font-size: 24rpx; padding: 10rpx 20rpx; border-radius: 28rpx;
				&.active { background: #FFF; color: #30BCB7; font-weight: 600; }
			}
		}
		.image-container {
			position: relative; width: 100%; height: 400rpx; background: #EEE;
			.contrast-image { width: 100%; height: 100%; }
			.image-overlay { position: absolute; bottom: 20rpx; right: 20rpx; .overlay-tag { background: rgba(0,0,0,0.6); padding: 8rpx 16rpx; border-radius: 10rpx; color: #FFF; font-size: 20rpx; } }
		}
	}

	.data-grid {
		display: flex; gap: 20rpx;
		.data-card {
			flex: 1; background: #F8F9FA; border-radius: 16rpx; padding: 20rpx; display: flex; flex-direction: column; align-items: center;
			.num { font-size: 36rpx; font-weight: 700; color: #333; }
			.unit { font-size: 20rpx; color: #999; }
			.desc { font-size: 22rpx; color: #666; }
			&.warning .num { color: #FA8C16; }
			&.danger .num { color: #FF4D4F; }
		}
	}

	.result-card {
		padding: 24rpx; border-radius: 16rpx; border: 2rpx solid transparent;
		&.pass { background: #F6FFED; border-color: #B7EB8F; }
		&.reject { background: #FFF2F0; border-color: #FFCCC7; }
		.result-header { display: flex; align-items: center; margin-bottom: 12rpx; .result-title { font-weight: 600; margin-left: 10rpx; } }
		.result-reason { font-size: 26rpx; line-height: 1.5; color: #666; }
	}

	.bottom-action-bar {
		position: fixed; bottom: 0; left: 0; right: 0; background: #FFF; padding: 24rpx 32rpx; display: flex; gap: 20rpx; box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05); z-index: 99;
		.btn {
			flex: 1; height: 88rpx; border-radius: 44rpx; font-size: 30rpx; display: flex; align-items: center; justify-content: center;
			&.primary { background: linear-gradient(135deg, #30BCB7, #25a5a0); color: #FFF; }
			&.secondary { background: #F5F7FA; color: #666; }
			&.danger-btn { background: #FF4D4F; color: #FFF; }
			&.full-width { width: 100%; flex: auto; }
			&[loading] { opacity: 0.7; }
		}
	}
</style>