class Game {
    constructor() {
        // 初始化画布
        this.leftCanvas = new DrawingCanvas('leftCanvas');
        this.rightCanvas = new DrawingCanvas('rightCanvas');
        
        // 初始化战场 - 使用新的格子大小
        const battlefieldCanvas = document.getElementById('battlefieldCanvas');
        battlefieldCanvas.width = 30 * 30;  // 30列 * 30像素
        battlefieldCanvas.height = 20 * 30;  // 20行 * 30像素
        this.battlefield = new Battlefield('battlefieldCanvas');
        
        // 设置按钮事件
        this.setupButtons();
        
        // 设置游戏循环
        this.setupGameLoop();
        
        // 初始化基地生命值显示
        this.leftBaseInfo = document.getElementById('leftBaseInfo');
        this.rightBaseInfo = document.getElementById('rightBaseInfo');
        
        // 按钮冷却时间（毫秒）
        this.cooldownTime = 3000;
        this.leftLastClick = 0;
        this.rightLastClick = 0;
        
        // 等待配置加载
        this.initializeAPI();
        
        // 设置系统提示词
        this.systemPrompt = `
            你是一个游戏中的单位识别器。你需要将玩家绘制的图像识别为以下单位之一：
            - 士兵：人形、火柴人等简单人物形象
            - 坦克：装甲车辆、坦克等陆地载具
            - 飞机：飞机、战斗机等空中单位
            - 大炮：火炮、加农炮等固定火力单位
            
            请直接返回单位名称，不要添加任何解释或其他文字。
            如果无法确定是哪个单位，请返回"未知单位"。
        `;
        
        // 添加游戏状态
        this.isGameOver = false;
    }

    async initializeAPI() {
        console.log('Initializing API...');
        let attempts = 0;
        const maxAttempts = 50; // 5秒后超时
        
        // 等待配置加载完成
        await new Promise((resolve, reject) => {
            const checkConfig = () => {
                console.log('Checking config attempt', attempts + 1, window.CONFIG);
                if (window.CONFIG?.OPENAI_API_KEY) {
                    this.apiKey = window.CONFIG.OPENAI_API_KEY;
                    console.log('API Key set successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Config loading timeout'));
                } else {
                    attempts++;
                    setTimeout(checkConfig, 100);
                }
            };
            checkConfig();
        }).catch(error => {
            console.error('Failed to initialize API:', error);
            alert('配置加载失败，请刷新页面重试');
        });
        
        console.log('Final API Key status:', !!this.apiKey);
    }

    setupButtons() {
        // 左侧按钮
        document.getElementById('leftClear').onclick = () => {
            this.leftCanvas.clear();
        };
        
        document.getElementById('leftConfirm').onclick = () => {
            const currentTime = Date.now();
            if (currentTime - this.leftLastClick >= this.cooldownTime) {
                this.handleConfirm('left');
                this.leftLastClick = currentTime;
                this.updateButtonState('left');
            }
        };
        
        // 右侧按钮
        document.getElementById('rightClear').onclick = () => {
            this.rightCanvas.clear();
        };
        
        document.getElementById('rightConfirm').onclick = () => {
            const currentTime = Date.now();
            if (currentTime - this.rightLastClick >= this.cooldownTime) {
                this.handleConfirm('right');
                this.rightLastClick = currentTime;
                this.updateButtonState('right');
            }
        };
    }

    updateButtonState(side) {
        const button = document.getElementById(`${side}Confirm`);
        button.disabled = true;
        button.textContent = '冷却中';
        
        setTimeout(() => {
            button.disabled = false;
            button.textContent = '确认';
        }, this.cooldownTime);
    }

    setupGameLoop() {
        const gameLoop = () => {
            this.battlefield.draw();
            this.updateBaseInfo();
            this.battlefield.updateUnits();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    async handleConfirm(side) {
        const canvas = side === 'left' ? this.leftCanvas : this.rightCanvas;
        const imageData = canvas.getImageData();
        
        // 检查画布是否为空
        if (!imageData) {
            alert('请先在画布上绘制单位');
            return;
        }
        
        try {
            // 调用 OpenAI API 识别绘画
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: this.systemPrompt
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: imageData,
                                        detail: "high"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 10
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const result = await response.json();
            console.log('API Response:', result);  // 添加完整的响应日志
            console.log('Image Data:', imageData.substring(0, 100) + '...');  // 打印图像数据的开头部分
            
            const unitType = result.choices[0].message.content.trim();
            console.log(`${side} canvas result:`, unitType);
            
            // 直接使用 AI 返回的单位类型
            if (unitType && ["士兵", "坦克", "飞机", "大炮"].includes(unitType)) {
                const unit = new Unit(unitType, side);
                if (this.battlefield.placeUnit(unit, side)) {
                    canvas.clear();
                    console.log(`Created and placed ${unitType} unit on ${side} side`);
                } else {
                    console.log(`Failed to place ${unitType} unit on ${side} side`);
                }
            } else {
                console.log(`Invalid unit type: ${unitType}`);
                alert('无法识别单位类型，请重试');
            }
            
        } catch (error) {
            console.error('Recognition error:', error);
            alert('识别失败: ' + error.message);
        }
    }

    analyzeDrawing(canvas) {
        const ctx = canvas.ctx;
        const imageData = ctx.getImageData(0, 0, canvas.canvas.width, canvas.canvas.height);
        const data = imageData.data;
        
        // 分析绘画特征
        let features = {
            width: 0,
            height: 0,
            hasVerticalLines: false,
            hasDiagonalLines: false,
            hasCircles: false,
            isRectangular: false,
            isTriangular: false
        };
        
        // 实现特征分析逻辑
        // ... 分析像素数据，提取特征
        
        return features;
    }

    recognizeUnit(features) {
        // 根据特征匹配单位类型
        for (const [type, rule] of Object.entries(this.recognitionRules)) {
            if (this.matchesRules(features, rule.rules)) {
                return rule.name;
            }
        }
        return "未知单位";
    }

    matchesRules(features, rules) {
        // 检查特征是否匹配规则
        for (const [key, value] of Object.entries(rules)) {
            if (!this.checkRule(features, key, value)) {
                return false;
            }
        }
        return true;
    }

    getRandomUnitType() {
        const types = ['士兵', '坦克', '飞机', '大炮'];
        return types[Math.floor(Math.random() * types.length)];
    }

    updateBaseInfo() {
        const leftBaseInfo = document.getElementById('leftBaseInfo');
        const rightBaseInfo = document.getElementById('rightBaseInfo');
        
        if (!leftBaseInfo || !rightBaseInfo) {
            console.error('Base info elements not found');
            return;
        }
        
        const leftBase = this.battlefield.getBase('left');
        const rightBase = this.battlefield.getBase('right');
        
        if (leftBase) {
            leftBaseInfo.textContent = `基地生命值: ${leftBase.hp}/1000`;
        }
        
        if (rightBase) {
            rightBaseInfo.textContent = `基地生命值: ${rightBase.hp}/1000`;
        }
        
        // 检查游戏是否结束
        if (!this.isGameOver && (leftBase?.hp <= 0 || rightBase?.hp <= 0)) {
            this.gameOver(leftBase?.hp <= 0 ? 'right' : 'left');
        }
    }

    gameOver(winner) {
        this.isGameOver = true;
        const message = `${winner === 'left' ? '左方' : '右方'}胜利！`;
        alert(message);
        
        // 自动重置游戏
        this.resetGame();
    }

    resetGame() {
        // 重置画布
        this.leftCanvas.clear();
        this.rightCanvas.clear();
        
        // 重置战场
        const battlefieldCanvas = document.getElementById('battlefieldCanvas');
        battlefieldCanvas.width = 30 * 30;  // 30列 * 30像素
        battlefieldCanvas.height = 20 * 30;  // 20行 * 30像素
        this.battlefield = new Battlefield('battlefieldCanvas');
        
        // 重置按钮状态
        this.leftLastClick = 0;
        this.rightLastClick = 0;
        document.getElementById('leftConfirm').disabled = false;
        document.getElementById('rightConfirm').disabled = false;
        document.getElementById('leftConfirm').textContent = '确';
        document.getElementById('rightConfirm').textContent = '确认';
        
        // 重置游戏状态
        this.isGameOver = false;
        
        // 重新开始游戏循环
        this.setupGameLoop();
        
        console.log('Game reset completed');
    }
}

// 当页面加载完成时启动游戏
window.onload = () => {
    const game = new Game();
}; 