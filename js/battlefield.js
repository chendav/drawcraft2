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
        
        // 添加单位图片加载
        this.unitImages = {};
        this.loadUnitImages();
        
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

    loadUnitImages() {
        // 定义单位图片路径
        const units = ['base', 'soldier', 'tank', 'plane', 'cannon'];
        
        units.forEach(unit => {
            const img = new Image();
            img.src = `assets/units/${unit}.png`;
            img.onload = () => {
                this.unitImages[this.getUnitType(unit)] = img;
            };
            img.onerror = () => {
                console.log(`Failed to load image for ${unit}`);
            };
        });
    }

    getUnitType(filename) {
        // 将文件名转换为单位类型
        const typeMap = {
            'base': '基地',
            'soldier': '士兵',
            'tank': '坦克',
            'plane': '飞机',
            'cannon': '大炮'
        };
        return typeMap[filename];
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
        const image = this.unitImages[unit.type];
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
        
        // 获取所有非基地单位���位置和信息
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
                // 如果有敌方单位在攻击范围内，进行攻击
                this.performAttack(unit, nearestEnemy.unit);
            } else {
                // 如果没有敌方单位在攻击范围内，向敌方基地移动
                const targetPos = unit.side === 'left' ? this.rightBasePos : this.leftBasePos;
                
                // 检查是否到达移动时间
                if (currentTime - lastMoveTime >= moveInterval) {
                    // 计算移动方向
                    const dx = Math.sign(targetPos.x - currentPos.x);
                    const dy = Math.sign(targetPos.y - currentPos.y);
                    
                    // 优先尝试水平移动
                    if (dx !== 0) {
                        const newX = currentPos.x + dx;
                        if (this.isValidMove(newX, currentPos.y)) {
                            this.grid[currentPos.y][currentPos.x] = null;
                            this.grid[currentPos.y][newX] = unit;
                            this.unitLastMoveTime.set(unit, currentTime);  // 更新移动时间
                            continue;
                        }
                    }
                    
                    // 如果水平移动失败，尝试垂直移动
                    if (dy !== 0) {
                        const newY = currentPos.y + dy;
                        if (this.isValidMove(currentPos.x, newY)) {
                            this.grid[currentPos.y][currentPos.x] = null;
                            this.grid[newY][currentPos.x] = unit;
                            this.unitLastMoveTime.set(unit, currentTime);  // 更新移动时间
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
                    
                    // 检查是否在攻击范围内且是最近的敌人
                    if (distance <= unit.attack_range && distance < minDistance) {
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

        // 尝试���平移动
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
} 