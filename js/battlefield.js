class Battlefield {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 30;
        this.width = 30;
        this.height = 20;
        this.canvas.width = this.width * this.cellSize;
        this.canvas.height = this.height * this.cellSize;
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
        
        // 初始化基地位置
        this.leftBasePos = {x: 0, y: Math.floor(this.height/2)};
        this.rightBasePos = {x: this.width-1, y: Math.floor(this.height/2)};
        
        this.initializeBases();
        
        // 添加背景图片
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/background.png';  // 确保有这个图片
        
        // 加载单位图片
        this.unitImages = {
            'soldier': new Image(),
            'tank': new Image(),
            'plane': new Image(),
            'cannon': new Image(),
            'godzilla': new Image(),
            'base': new Image()
        };

        // 设置图源
        this.unitImages.soldier.src = 'assets/units/soldier.png';
        this.unitImages.tank.src = 'assets/units/tank.png';
        this.unitImages.plane.src = 'assets/units/plane.png';
        this.unitImages.cannon.src = 'assets/units/cannon.png';
        this.unitImages.godzilla.src = 'assets/units/godzilla.png';
        this.unitImages.base.src = 'assets/units/base.png';  // 设置基地图片路径

        // 单位类型到图片的映射
        this.typeToImage = {
            '士兵': 'soldier',
            '坦克': 'tank',
            '飞机': 'plane',
            '大炮': 'cannon',
            '哥斯拉': 'godzilla',
            '基地': 'base'  // 添加基地映射
        };
        
        // 为每个单位添加独立的移动时间记录
        this.unitLastMoveTime = new Map();
        this.baseInterval = 2000;  // 基础移动间隔（2秒）
        
        // 添加单位移动路线的记录
        this.unitPaths = new Map();  // 记录每个单位的移动路线
    }

    initializeBases() {
        // 创建基地单位
        const leftBase = new Unit("基地", "left");
        const rightBase = new Unit("基地", "right");
        
        // 放置基地
        this.grid[this.leftBasePos.y][this.leftBasePos.x] = leftBase;
        this.grid[this.rightBasePos.y][this.rightBasePos.x] = rightBase;
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        if (this.backgroundImage.complete) {  // 确保图片已加载
            // 方式1：拉伸背景以适应画布
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
            
            // 或者方式2：平铺背景
            // const pattern = this.ctx.createPattern(this.backgroundImage, 'repeat');
            // this.ctx.fillStyle = pattern;
            // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // 如果图片未加载完成，使用纯色背景
            this.ctx.fillStyle = '#e0e0e0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 绘制单位
        this.drawUnits();
    }

    drawUnits() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const unit = this.grid[y][x];
                if (unit) {
                    this.drawUnit(unit, x, y);
                }
            }
        }
    }

    drawUnit(unit, x, y) {
        const centerX = x * this.cellSize;
        const centerY = y * this.cellSize;
        
        // 检查是否有对应的图片
        const image = this.unitImages[this.typeToImage[unit.type]];
        if (image) {
            // 绘制图片
            this.ctx.save();
            
            // 如果是右方单位，使用蓝色色调
            if (unit.side === 'right') {
                this.ctx.filter = 'hue-rotate(240deg)';  // 转为蓝色
            }
            
            // 如果是基地，绘制3x3大小
            if (unit.type === '基地') {
                const baseSize = this.cellSize * 3;  // 基地占用3x3格子
                this.ctx.drawImage(
                    image,
                    centerX - this.cellSize,  // 向左偏移一格
                    centerY - this.cellSize,  // 向上偏移一格
                    baseSize,
                    baseSize
                );
            } else {
                // 其他单位保持原来的大小
                this.ctx.drawImage(
                    image,
                    centerX,
                    centerY,
                    this.cellSize,
                    this.cellSize
                );
            }
            
            this.ctx.restore();
        } else {
            // 如果没有图片，使用备用的圆形显示
            const radius = this.cellSize * 0.4;
            this.ctx.beginPath();
            this.ctx.arc(
                centerX + this.cellSize/2,
                centerY + this.cellSize/2,
                radius,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = unit.side === 'left' ? 'red' : 'blue';
            this.ctx.fill();
            
            // 绘制单位类型文字
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                unit.type[0],
                centerX + this.cellSize/2,
                centerY + this.cellSize/2
            );
        }
    }

    placeUnit(unit, side) {
        // 根据基地位置确定生成位置
        const basePos = side === 'left' ? this.leftBasePos : this.rightBasePos;
        const startX = side === 'left' ? basePos.x + 2 : basePos.x - 1;  // 在基地旁边
        
        // 尝试在基地周围放置单位（基地周围的位置）
        const positions = [
            // 基地中间行的位置
            {x: startX, y: basePos.y},
            // 基地上方的位置
            {x: startX, y: basePos.y - 1},
            {x: startX, y: basePos.y - 2},
            // 基地下方的位置
            {x: startX, y: basePos.y + 1},
            {x: startX, y: basePos.y + 2}
        ];
        
        // 如果初始位置都被占用，继续向外扩展
        const maxTries = 10;
        let currentX = startX;
        
        for (let i = 0; i < maxTries; i++) {
            for (const pos of positions) {
                if (pos.y >= 0 && pos.y < this.height && !this.grid[pos.y][currentX]) {
                    this.grid[pos.y][currentX] = unit;
                    // 随机分配移动路线
                    this.assignMovementPath(unit, pos.y);
                    return true;
                }
            }
            
            // 如果当前列都满了，移动到下一列
            if (side === 'left') {
                currentX++;  // 左方向右扩展
                if (currentX >= this.width / 2) break;  // 不超过中线
            } else {
                currentX--;  // 右方向左扩展
                if (currentX <= this.width / 2) break;  // 不超过中线
            }
            
            // 更新positions数组中的x坐标
            positions.forEach(pos => pos.x = currentX);
        }
        
        return false;  // 如果所有可用位置都被占用，返回失败
    }

    // 新增：分配移动路线
    assignMovementPath(unit, startY) {
        // 随机选择一条路线（上、中、下）
        const paths = ['top', 'middle', 'bottom'];
        const path = paths[Math.floor(Math.random() * paths.length)];
        this.unitPaths.set(unit, {
            path: path,
            targetY: this.getTargetY(path)
        });
    }

    // 新增：获取目标Y坐标
    getTargetY(path) {
        switch(path) {
            case 'top':
                return Math.floor(this.height * 0.2);  // 上路
            case 'middle':
                return Math.floor(this.height * 0.5);  // 中路
            case 'bottom':
                return Math.floor(this.height * 0.8);  // 下路
        }
    }

    getBase(side) {
        // 返回指定方的基地
        if (side === 'left') {
            return this.grid[this.leftBasePos.y][this.leftBasePos.x];
        } else if (side === 'right') {
            return this.grid[this.rightBasePos.y][this.rightBasePos.x];
        }
        return null;
    }

    updateUnits() {
        const currentTime = Date.now();
        
        // 获取所有非基地单位位置和信息
        const units = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const unit = this.grid[y][x];
                if (unit && unit.type !== "基地") {
                    units.push({
                        unit: unit,
                        pos: {x, y}
                    });
                }
            }
        }

        // 处理每个单位的移动和攻击
        for (const unitInfo of units) {
            const unit = unitInfo.unit;
            const currentPos = unitInfo.pos;
            
            // 获取或初始化这个单位的上次移动时间
            if (!this.unitLastMoveTime.has(unit)) {
                this.unitLastMoveTime.set(unit, currentTime);
            }
            
            // 计算这个单位的移动间隔
            const moveInterval = Math.floor(this.baseInterval / unit.speed);
            const lastMoveTime = this.unitLastMoveTime.get(unit);
            
            // 寻找攻击范围内最近的敌方单位
            const nearestEnemy = this.findNearestEnemyInRange(currentPos, unit);
            
            if (nearestEnemy) {
                // 如果有敌方单位在攻击范围内，停止移动并进行攻击
                this.performAttack(unit, nearestEnemy.unit);
            } else {
                // 只有在攻击范围内没有敌人时才移动
                const targetPos = unit.side === 'left' ? this.rightBasePos : this.leftBasePos;
                
                // 检查是否到达移动时间
                if (currentTime - lastMoveTime >= moveInterval) {
                    // 使用 moveTowardsTarget 方法，它会根据分配的路线移动
                    this.moveTowardsTarget(unit, currentPos, targetPos);
                    this.unitLastMoveTime.set(unit, currentTime);
                }
            }
        }
        
        // 清理已经不存在的单位的移动时间记录
        for (const [unit] of this.unitLastMoveTime) {
            let unitExists = false;
            for (const {unit: existingUnit} of units) {
                if (unit === existingUnit) {
                    unitExists = true;
                    break;
                }
            }
            if (!unitExists) {
                this.unitLastMoveTime.delete(unit);
            }
        }
    }

    findNearestEnemyInRange(pos, unit) {
        let nearestEnemy = null;
        let minDistance = Infinity;

        // 遍历所有格子寻找敌方单位
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const target = this.grid[y][x];
                if (target && target.side !== unit.side) {
                    const distance = Math.sqrt(
                        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                    );
                    
                    // 使用 unit.range 而不是 unit.attack_range
                    if (distance <= unit.range && distance < minDistance) {
                        minDistance = distance;
                        nearestEnemy = {
                            unit: target,
                            pos: {x, y},
                            distance: distance
                        };
                    }
                }
            }
        }

        return nearestEnemy;
    }

    performAttack(attacker, target) {
        // 计算伤害
        let damage = attacker.attack;
        
        // 检查克制关系
        if (UNIT_COUNTERS[attacker.type]?.includes(target.type)) {
            damage *= COUNTER_BONUS;
        }
        
        // 应用伤害
        target.hp -= damage;
        
        // 如果目标被消灭
        if (target.hp <= 0) {
            if (target.type === "基地") {
                target.hp = 0;  // 确保基地生命值不会变成负数
                // 不要提前返回，让游戏状态更新逻辑处理游戏结束
            } else {
                // 如果是普通单位被消灭，从网格中移除
                const targetPos = this.findUnitPosition(target);
                if (targetPos) {
                    this.grid[targetPos.y][targetPos.x] = null;
                    this.unitPaths.delete(target);  // 清理路线记录
                }
            }
        }
        
        // 打印调试信息
        console.log(`${attacker.type} attacked ${target.type}, damage: ${damage}, target HP: ${target.hp}`);
    }

    moveTowardsTarget(unit, currentPos, targetPos) {
        const pathInfo = this.unitPaths.get(unit);
        if (!pathInfo) return;

        // 首先移动到指定路线的Y坐标
        if (Math.abs(currentPos.y - pathInfo.targetY) > 1) {
            // 需要先调整Y坐标到指定路线
            const dy = Math.sign(pathInfo.targetY - currentPos.y);
            const newY = currentPos.y + dy;
            if (this.isValidMove(currentPos.x, newY)) {
                this.grid[currentPos.y][currentPos.x] = null;
                this.grid[newY][currentPos.x] = unit;
                return;
            }
        }

        // 在正确的Y坐标上后，向目标移动
        const dx = Math.sign(targetPos.x - currentPos.x);
        if (dx !== 0) {
            const newX = currentPos.x + dx;
            if (this.isValidMove(newX, currentPos.y)) {
                // 可以直接水平移动
                this.grid[currentPos.y][currentPos.x] = null;
                this.grid[currentPos.y][newX] = unit;
            } else {
                // 如果水平移动被阻挡，尝试绕路
                // 向上或向下移动一格来绕过障碍
                const upY = currentPos.y - 1;
                const downY = currentPos.y + 1;
                
                // 优先选择朝向目标路线的方向
                if (Math.abs(upY - pathInfo.targetY) < Math.abs(downY - pathInfo.targetY)) {
                    // 优先尝试向上
                    if (this.isValidMove(currentPos.x, upY)) {
                        this.grid[currentPos.y][currentPos.x] = null;
                        this.grid[upY][currentPos.x] = unit;
                    } else if (this.isValidMove(currentPos.x, downY)) {
                        this.grid[currentPos.y][currentPos.x] = null;
                        this.grid[downY][currentPos.x] = unit;
                    }
                } else {
                    // 优先尝试向下
                    if (this.isValidMove(currentPos.x, downY)) {
                        this.grid[currentPos.y][currentPos.x] = null;
                        this.grid[downY][currentPos.x] = unit;
                    } else if (this.isValidMove(currentPos.x, upY)) {
                        this.grid[currentPos.y][currentPos.x] = null;
                        this.grid[upY][currentPos.x] = unit;
                    }
                }
            }
        }
    }

    isValidMove(x, y) {
        // 检查是否在战场范围内
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        // 检查目标位置是否为空
        if (this.grid[y][x] !== null) {
            return false;
        }
        
        // 检查是否是基地位置
        if ((x === this.leftBasePos.x && y === this.leftBasePos.y) ||
            (x === this.rightBasePos.x && y === this.rightBasePos.y)) {
            return false;
        }
        
        return true;
    }

    findUnitPosition(unit) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === unit) {
                    return {x, y};
                }
            }
        }
        return null;
    }

    // 添加新方法：检查位置是否在敌人的攻击范围内
    isInEnemyRange(pos, unit) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const enemy = this.grid[y][x];
                if (enemy && enemy.side !== unit.side) {
                    const distance = Math.sqrt(
                        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                    );
                    // 使用 enemy.range 而不是 enemy.attack_range
                    if (distance <= enemy.range) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 添加新方法：检查路径上是否有敌人
    checkEnemyInPath(from, to, unit) {
        // 检查目标位置是否有敌人
        const targetUnit = this.grid[to.y][to.x];
        if (targetUnit && targetUnit.side !== unit.side) {
            return true;
        }
        
        // 检查移动路径上是否有敌人
        const dx = Math.sign(to.x - from.x);
        const dy = Math.sign(to.y - from.y);
        let x = from.x;
        let y = from.y;
        
        while (x !== to.x || y !== to.y) {
            if (dx !== 0) x += dx;
            if (dy !== 0) y += dy;
            
            const checkUnit = this.grid[y][x];
            if (checkUnit && checkUnit.side !== unit.side) {
                return true;
            }
        }
        
        return false;
    }
} 