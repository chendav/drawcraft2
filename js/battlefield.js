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
        
        // 加载单位图片
        this.unitImages = {
            'soldier': new Image(),
            'tank': new Image(),
            'plane': new Image(),
            'cannon': new Image(),
            'godzilla': new Image(),
            'base': new Image()  // 添加基地图片
        };

        // 设置图片源
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
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制单位
        this.drawUnits();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ccc';
        
        // 绘制垂直线
        for (let x = 0; x <= this.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.height * this.cellSize);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.width * this.cellSize, y * this.cellSize);
            this.ctx.stroke();
        }
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
            
            this.ctx.drawImage(
                image,
                centerX,
                centerY,
                this.cellSize,
                this.cellSize
            );
            
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
        const startX = side === 'left' ? 1 : this.width - 2;
        
        // 寻找空位放置单位
        for (let y = 0; y < this.height; y++) {
            if (!this.grid[y][startX]) {
                this.grid[y][startX] = unit;
                return true;
            }
        }
        return false;
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
                    // 计算移动方向
                    const dx = Math.sign(targetPos.x - currentPos.x);
                    const dy = Math.sign(targetPos.y - currentPos.y);
                    
                    // 优先尝试水平移动
                    if (dx !== 0) {
                        const newX = currentPos.x + dx;
                        // 检��移动后的位置是否会进入敌人的攻击范围
                        if (this.isValidMove(newX, currentPos.y) && !this.isInEnemyRange({x: newX, y: currentPos.y}, unit)) {
                            this.grid[currentPos.y][currentPos.x] = null;
                            this.grid[currentPos.y][newX] = unit;
                            this.unitLastMoveTime.set(unit, currentTime);
                            continue;
                        }
                    }
                    
                    // 如果水平移动失败，尝试垂直移动
                    if (dy !== 0) {
                        const newY = currentPos.y + dy;
                        // 检查移动后的位置是否会进入敌人的攻击范围
                        if (this.isValidMove(currentPos.x, newY) && !this.isInEnemyRange({x: currentPos.x, y: newY}, unit)) {
                            this.grid[currentPos.y][currentPos.x] = null;
                            this.grid[newY][currentPos.x] = unit;
                            this.unitLastMoveTime.set(unit, currentTime);
                        }
                    }
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
        target.hp -= attacker.attack;
        
        // 如果目标被消灭且是基地，则造成双倍伤害
        if (target.hp <= 0 && target.type === "基地") {
            target.hp = 0;  // 确保生命值不会变成负数
        }
        // 如果是普通单位被消灭，则从网格中移除
        else if (target.hp <= 0 && target.type !== "基地") {
            const targetPos = this.findUnitPosition(target);
            if (targetPos) {
                this.grid[targetPos.y][targetPos.x] = null;
            }
        }
    }

    moveTowardsTarget(unit, currentPos, targetPos) {
        // 计算移动方向
        const dx = Math.sign(targetPos.x - currentPos.x);
        const dy = Math.sign(targetPos.y - currentPos.y);

        // 尝试水平移动
        if (dx !== 0) {
            const newX = currentPos.x + dx;
            if (this.isValidMove(newX, currentPos.y)) {
                this.grid[currentPos.y][currentPos.x] = null;
                this.grid[currentPos.y][newX] = unit;
                return;
            }
        }

        // 如果水平移动失败，尝试垂直移动
        if (dy !== 0) {
            const newY = currentPos.y + dy;
            if (this.isValidMove(currentPos.x, newY)) {
                this.grid[currentPos.y][currentPos.x] = null;
                this.grid[newY][currentPos.x] = unit;
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
} 