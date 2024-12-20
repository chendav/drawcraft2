import { Unit, UNIT_STATS, UNIT_COUNTERS, COUNTER_BONUS } from './unit.js';
import { 
    TerrainManager, 
    TERRAIN_TYPES,
    TERRAIN_EFFECTS,
    TERRAIN_GENERATION,
    TERRAIN_MOVEMENT_RULES 
} from './terrain.js';

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
        
        // 创建基地单位（直接定义属性）
        const leftBase = {
            type: "基地",
            side: "left",
            hp: 10000,
            maxHp: 10000,
            attack: 10,
            speed: 0,
            range: 4,
            attack_speed: 1
        };
        
        const rightBase = {
            type: "基地",
            side: "right",
            hp: 10000,
            maxHp: 10000,
            attack: 10,
            speed: 0,
            range: 4,
            attack_speed: 1
        };
        
        // 放置基地
        this.grid[this.leftBasePos.y][this.leftBasePos.x] = leftBase;
        this.grid[this.rightBasePos.y][this.rightBasePos.x] = rightBase;
        
        // 先加载图片和其他资源
        this.loadResources();
        
        // 单位类型到图片的映射
        this.typeToImage = {
            '士兵': 'soldier',
            '坦克': 'tank',
            '飞机': 'plane',
            '大炮': 'cannon',
            '哥斯拉': 'godzilla',
            '基地': 'base',
            '防御墙': 'wall',
            'UFO': 'ufo',
            '骑兵': 'cavalry',
            '医疗兵': 'medic',
            '高达': 'gundam',
            '弓箭手': 'archer',
            '长矛兵': 'spearman',
            '剑士': 'swordsman'
        };
        
        // 为每个单位添加独立的移动时间记录
        this.unitLastMoveTime = new Map();
        this.baseInterval = 2000;  // 基础移动间隔（2秒）
        
        // 添加单位移动路线的记录
        this.unitPaths = new Map();  // 记录每个单位的移动路线
        
        // 添加攻击效果列表
        this.attackEffects = [];
        
        // 添加治疗效果列表
        this.healEffects = [];
        
        // 添加待放置单位的状态
        this.pendingUnit = null;
        this.pendingUnitSide = null;
        
        // 添加画布点击事件
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        
        // 初始化音效
        this.sounds = {
            'soldier': new Audio('assets/sounds/soldier_attack.mp3'),
            'tank': new Audio('assets/sounds/tank_attack.mp3'),
            'plane': new Audio('assets/sounds/plane_attack.mp3'),
            'cannon': new Audio('assets/sounds/cannon_attack.mp3'),
            'godzilla': new Audio('assets/sounds/godzilla_attack.mp3'),
            'base': new Audio('assets/sounds/base_attack.mp3'),
            'wall': new Audio('assets/sounds/wall_attack.mp3'),
            'ufo': new Audio('assets/sounds/ufo_attack.mp3'),
            'cavalry': new Audio('assets/sounds/cavalry_attack.mp3'),
            'medic': new Audio('assets/sounds/heal.mp3'),
            'gundam': new Audio('assets/sounds/gundam_attack.mp3'),
            'archer': new Audio('assets/sounds/arrow.mp3'),
            'spearman': new Audio('assets/sounds/spear.mp3'),
            'swordsman': new Audio('assets/sounds/sword.mp3')
        };
    }

    async loadResources() {
        // 加载单位图片
        this.unitImages = {
            'soldier': new Image(),
            'tank': new Image(),
            'plane': new Image(),
            'cannon': new Image(),
            'godzilla': new Image(),
            'base': new Image(),
            'wall': new Image(),
            'ufo': new Image(),
            'cavalry': new Image(),
            'medic': new Image(),
            'gundam': new Image(),
            'archer': new Image(),
            'spearman': new Image(),
            'swordsman': new Image()
        };

        // 返回一个 Promise，在所有图片加载完成后解析
        this.loadingPromise = new Promise((resolve) => {
            this.loadedImages = 0;
            this.totalImages = Object.keys(this.unitImages).length;

            Object.entries(this.unitImages).forEach(([key, img]) => {
                img.onload = () => {
                    this.loadedImages++;
                    console.log(`Successfully loaded unit image: ${key} (${this.loadedImages}/${this.totalImages})`);
                    if (this.loadedImages === this.totalImages) {
                        console.log('All unit images loaded successfully');
                        resolve();
                    }
                };
                img.onerror = (e) => {
                    console.error(`Failed to load unit image: ${key}`, e);
                    console.log('Attempted URL:', img.src);
                    // 尝试重新加载
                    setTimeout(() => {
                        console.log(`Retrying to load ${key}...`);
                        img.src = img.src;
                    }, 1000);
                };
            });
        });

        // 设置图片源
        this.unitImages.soldier.src = 'assets/units/soldier.png';
        this.unitImages.tank.src = 'assets/units/tank.png';
        this.unitImages.plane.src = 'assets/units/plane.png';
        this.unitImages.cannon.src = 'assets/units/cannon.png';
        this.unitImages.godzilla.src = 'assets/units/godzilla.png';
        this.unitImages.base.src = 'assets/units/base.png';
        this.unitImages.wall.src = 'assets/units/wall.png';
        this.unitImages.ufo.src = 'assets/units/ufo.png';
        this.unitImages.cavalry.src = 'assets/units/cavalry.png';
        this.unitImages.medic.src = 'assets/units/medic.png';
        this.unitImages.gundam.src = 'assets/units/gundam.png';
        this.unitImages.archer.src = 'assets/units/archer.png';
        this.unitImages.spearman.src = 'assets/units/spearman.png';
        this.unitImages.swordsman.src = 'assets/units/swordsman.png';

        console.log('Attempting to load unit images...');
        Object.entries(this.unitImages).forEach(([key, img]) => {
            console.log(`Setting src for ${key}:`, img.src);
        });

        // 使用 TerrainManager 替代原有的地形管理
        this.terrainManager = new TerrainManager(this.width, this.height);
        this.terrainManager.loadPresetMap('map1');
    }

    placeUnit(unit, side) {
        // 如果是基地，使用固定位置
        if (unit.type === "基地") {
            const basePos = side === 'left' ? this.leftBasePos : this.rightBasePos;
            if (this.grid[basePos.y][basePos.x]) {
                console.error('Base position already occupied');
                return false;
            }
            this.grid[basePos.y][basePos.x] = unit;
            console.log(`Placed ${side} base at (${basePos.x}, ${basePos.y})`);
            return true;
        }

        // 获取基地位置和起始位置
        const basePos = side === 'left' ? this.leftBasePos : this.rightBasePos;
        const startX = side === 'left' ? basePos.x + 1 : basePos.x - 1;
        
        console.log(`Attempting to place ${unit.type} for ${side} side at x=${startX}`);
        
        // 尝试在基地周围放置单位
        const positions = [
            {x: startX, y: basePos.y},      // 基地同行
            {x: startX, y: basePos.y - 1},  // 基地上方
            {x: startX, y: basePos.y + 1}   // 基地下方
        ];
        
        // 如果初始位置都被占用，继续外扩
        const maxTries = 10;
        let currentX = startX;
        
        for (let i = 0; i < maxTries; i++) {
            for (const pos of positions) {
                if (pos.y >= 0 && pos.y < this.height && !this.grid[pos.y][currentX]) {
                    console.log(`Placing ${unit.type} at (${currentX}, ${pos.y})`);
                    this.grid[pos.y][currentX] = unit;
                    // 随机分配移动路线
                    this.assignMovementPath(unit, pos.y);
                    return true;
                }
            }
            
            // 如果当前列都满了，移动到下一列
            if (side === 'left') {
                currentX++;  // 左方向右扩展
                if (currentX >= this.width / 2) {
                    console.log('Reached middle of map for left side');
                    break;
                }
            } else {
                currentX--;  // 右方向左扩展
                if (currentX <= this.width / 2) {
                    console.log('Reached middle of map for right side');
                    break;
                }
            }
            
            console.log(`Moving to next column: ${currentX}`);
            // 更新positions数组中的x坐标
            positions.forEach(pos => pos.x = currentX);
        }
        
        console.log(`Failed to place ${unit.type} for ${side} side`);
        return false;  // 如果所有可用位置都被占用，返回失败
    }

    // 新增：分配移动路线
    assignMovementPath(unit, startY) {
        const paths = ['top', 'middle', 'bottom'];
        const path = paths[Math.floor(Math.random() * paths.length)];
        this.unitPaths.set(unit, {
            path: path,
            targetY: this.getTargetY(path),
            lastMoveDirection: null  // 添加移动方向记录
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
        const basePos = side === 'left' ? this.leftBasePos : this.rightBasePos;
        return this.grid[basePos.y][basePos.x];
    }

    updateUnits() {
        const currentTime = Date.now();
        
        // 获取所有单位位置和信息（包括基地）
        const units = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const unit = this.grid[y][x];
                if (unit) {
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
            
            // 获取或初始化这个单位的上次行动时间
            if (!this.unitLastMoveTime.has(unit)) {
                this.unitLastMoveTime.set(unit, currentTime);
            }
            
            const lastMoveTime = this.unitLastMoveTime.get(unit);
            
            // 寻找攻击范围内最近的敌方单位
            const nearestEnemy = this.findNearestEnemyInRange(currentPos, unit);
            
            if (nearestEnemy) {
                // 如果有敌方单位在攻击范围内，进行攻击
                // 使用 attack_speed 计算攻击间隔
                const attackInterval = Math.floor(this.baseInterval / unit.attack_speed);
                if (currentTime - lastMoveTime >= attackInterval) {
                    this.performAttack(unit, nearestEnemy.unit);
                    this.unitLastMoveTime.set(unit, currentTime);
                    console.log(`${unit.type} 攻击 ${nearestEnemy.unit.type}, 距离: ${nearestEnemy.distance}`);
                }
            } else if (unit.type !== "基地") {
                // 只有在攻击范围内没有敌人时才移动
                const targetPos = unit.side === 'left' ? this.rightBasePos : this.leftBasePos;
                
                // 使用 speed 计算移动间隔
                const moveInterval = Math.floor(this.baseInterval / unit.speed);
                if (currentTime - lastMoveTime >= moveInterval) {
                    this.moveTowardsTarget(unit, currentPos, targetPos);
                    this.unitLastMoveTime.set(unit, currentTime);
                }
            }
        }
        
        // 清理已经不存在的单位的记录
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
                this.unitPaths.delete(unit);  // 同时清理路径记录
            }
        }
    }

    findNearestEnemyInRange(pos, unit) {
        let nearestTarget = null;
        let minDistance = Infinity;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const target = this.grid[y][x];
                if (target) {
                    // 医疗兵寻找受伤的友军，其他单位寻找敌人
                    if ((unit.type === "医疗兵" && target.side === unit.side && target.hp < target.maxHp) ||
                        (unit.type !== "医疗兵" && target.side !== unit.side)) {
                        
                        const distance = Math.sqrt(
                            Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                        );
                        
                        if (distance <= unit.range && distance < minDistance) {
                            minDistance = distance;
                            nearestTarget = {
                                unit: target,
                                pos: {x, y},
                                distance: distance
                            };
                        }
                    }
                }
            }
        }

        return nearestTarget;
    }

    performAttack(attacker, target) {
        // 获取攻击者对应的音效
        const soundKey = this.typeToImage[attacker.type];
        const sound = this.sounds[soundKey];
        
        // 如果有音效且音效已加载，播放音效
        if (sound && sound.readyState >= 2) {
            // 重置音效播放位置（允许快速重复播放）
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn('Failed to play sound:', error);
            });
        }

        // 如果是医疗兵且目标是友方单位，进行治疗
        if (attacker.type === "医疗兵" && target.side === attacker.side) {
            // 计算治疗量
            const healAmount = UNIT_STATS["医疗兵"].heal_power;
            
            // 只有当目标生命值未满时才进行治疗
            if (target.hp < target.maxHp) {
                // 应用治疗
                target.hp = Math.min(target.hp + healAmount, target.maxHp);
                
                // 创建治疗效果
                this.createHealEffect(attacker, target, healAmount);
                
                console.log(`${attacker.type} healed ${target.type}, amount: ${healAmount}, target HP: ${target.hp}`);
            }
        } else {
            // 原有的攻击逻辑
            let damage = attacker.attack;
            if (UNIT_COUNTERS[attacker.type]?.includes(target.type)) {
                damage *= COUNTER_BONUS;
            }
            
            this.createAttackEffect(attacker, target, damage);
            target.hp -= damage;
            
            // 如果目标被消灭
            if (target.hp <= 0) {
                if (target.type === "基地") {
                    target.hp = 0;  // 基地生命值会变成负数
                    // 不要提前返回，让游戏状态更新逻辑处游戏结束
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
    }

    // 添加 A* 寻路算法
    findPath(startPos, targetPos, unit) {
        console.log(`Finding path for ${unit.type} from (${startPos.x}, ${startPos.y}) to (${targetPos.x}, ${targetPos.y})`);
        
        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        // 将坐标转换为字符串作为键
        const posToKey = (pos) => `${pos.x},${pos.y}`;
        const keyToPos = (key) => {
            const [x, y] = key.split(',').map(Number);
            return {x, y};
        };
        
        const startKey = posToKey(startPos);
        openSet.add(startKey);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startPos, targetPos));
        
        let iterations = 0;
        const maxIterations = 1000;  // 防止无限循环
        
        while (openSet.size > 0 && iterations < maxIterations) {
            iterations++;
            
            // 找到 f 值最小的节点
            let currentKey = null;
            let lowestF = Infinity;
            for (const key of openSet) {
                const f = fScore.get(key);
                if (f < lowestF) {
                    lowestF = f;
                    currentKey = key;
                }
            }
            
            const current = keyToPos(currentKey);
            console.log(`Checking position (${current.x}, ${current.y})`);
            
            // 如果到达目标附近
            if (Math.abs(current.x - targetPos.x) <= 1 && Math.abs(current.y - targetPos.y) <= 1) {
                console.log('Found path to target');
                return this.reconstructPath(cameFrom, currentKey);
            }
            
            openSet.delete(currentKey);
            closedSet.add(currentKey);
            
            // 检查相邻的格子
            const neighbors = [
                {x: current.x + 1, y: current.y},  // 右
                {x: current.x - 1, y: current.y},  // 左
                {x: current.x, y: current.y + 1},  // 下
                {x: current.x, y: current.y - 1}   // 上
            ];
            
            for (const neighbor of neighbors) {
                const neighborKey = posToKey(neighbor);
                
                // 跳过已经检查过的节点
                if (closedSet.has(neighborKey)) continue;
                
                // 检查是否可以移动到这个格子
                if (!this.isValidMove(neighbor.x, neighbor.y, unit)) {
                    console.log(`Cannot move to (${neighbor.x}, ${neighbor.y})`);
                    continue;
                }
                
                // 计算从起点经过当前节点到邻居节点的距离
                const tentativeG = gScore.get(currentKey) + 1;
                
                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                } else if (tentativeG >= gScore.get(neighborKey)) {
                    continue;
                }
                
                // 这条路径更好，记录下来
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, targetPos));
            }
        }
        
        console.log('No path found');
        return null;
    }
    
    // 启发式函数：曼哈顿距离
    heuristic(pos, target) {
        return Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y);
    }
    
    // 重建路径
    reconstructPath(cameFrom, currentKey) {
        const path = [currentKey];
        while (cameFrom.has(currentKey)) {
            currentKey = cameFrom.get(currentKey);
            path.unshift(currentKey);
        }
        return path.map(key => {
            const [x, y] = key.split(',').map(Number);
            return {x, y};
        });
    }

    // 修改移动逻辑，使用 A* 寻路
    moveTowardsTarget(unit, currentPos, targetPos) {
        console.log(`Moving ${unit.type} from (${currentPos.x}, ${currentPos.y}) to (${targetPos.x}, ${targetPos.y})`);
        
        // 如果已经在目标附近，不需要移动
        if (Math.abs(currentPos.x - targetPos.x) <= 1 && Math.abs(currentPos.y - targetPos.y) <= 1) {
            console.log('Already near target');
            return;
        }
        
        // 确定移动方向
        const dx = Math.sign(targetPos.x - currentPos.x);
        const dy = Math.sign(targetPos.y - currentPos.y);
        
        // 尝试移动的优先顺序：水平、垂直、对角线
        let moved = false;
        
        // 1. 尝试水平移动
        if (dx !== 0) {
            const newX = currentPos.x + dx;
            if (this.isValidMove(newX, currentPos.y, unit)) {
                console.log(`${unit.type} moving horizontally to (${newX}, ${currentPos.y})`);
                this.grid[currentPos.y][currentPos.x] = null;
                this.grid[currentPos.y][newX] = unit;
                moved = true;
                return;
            }
        }
        
        // 2. 如果水平移动失败，尝试垂直移动
        if (!moved && dy !== 0) {
            const newY = currentPos.y + dy;
            if (this.isValidMove(currentPos.x, newY, unit)) {
                console.log(`${unit.type} moving vertically to (${currentPos.x}, ${newY})`);
                this.grid[currentPos.y][currentPos.x] = null;
                this.grid[newY][currentPos.x] = unit;
                moved = true;
                return;
            }
        }
        
        // 3. 如果直线移动都失败，尝试其他可能的移动方向
        if (!moved) {
            const directions = [
                {dx: 0, dy: -1},  // 
                {dx: 0, dy: 1},   // 下
                {dx: -1, dy: 0},  // 左
                {dx: 1, dy: 0}    // 右
            ];
            
            // ���机打乱移动方向，避免单位总是走相同的路线
            directions.sort(() => Math.random() - 0.5);
            
            for (const dir of directions) {
                const newX = currentPos.x + dir.dx;
                const newY = currentPos.y + dir.dy;
                
                if (this.isValidMove(newX, newY, unit)) {
                    console.log(`${unit.type} moving to (${newX}, ${newY})`);
                    this.grid[currentPos.y][currentPos.x] = null;
                    this.grid[newY][newX] = unit;
                    moved = true;
                    break;
                }
            }
        }
        
        if (!moved) {
            console.log(`${unit.type} at (${currentPos.x}, ${currentPos.y}) is blocked`);
        }
    }

    isValidMove(x, y, unit) {
        // 基本检查
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        // 检查目标位置是否被占用
        if (this.grid[y][x] !== null) {
            return false;
        }
        
        // 使用 TerrainManager 检查地形限制
        if (!unit) {
            console.warn('No unit provided for terrain check');
            return true;  // 如果没有提供单位，默认允许移动
        }
        
        return this.terrainManager.canUnitPass(unit, x, y);
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

    // 添加新方法：创建攻击效果
    createAttackEffect(attacker, target, damage) {
        const attackerPos = this.findUnitPosition(attacker);
        const targetPos = this.findUnitPosition(target);
        
        if (!attackerPos || !targetPos) return;
        
        this.attackEffects.push({
            startX: attackerPos.x * this.cellSize + this.cellSize/2,
            startY: attackerPos.y * this.cellSize + this.cellSize/2,
            endX: targetPos.x * this.cellSize + this.cellSize/2,
            endY: targetPos.y * this.cellSize + this.cellSize/2,
            progress: 0,
            damage: damage,
            startTime: Date.now()
        });
    }

    // 添加新方法：绘制击效果
    drawAttackEffects() {
        const currentTime = Date.now();
        const effectDuration = 500; // 效果持续500毫秒
        
        // 更新和绘制每个攻击效果
        this.attackEffects = this.attackEffects.filter(effect => {
            const elapsed = currentTime - effect.startTime;
            effect.progress = elapsed / effectDuration;
            
            if (effect.progress >= 1) {
                return false; // 移除完成的效果
            }
            
            // 绘制攻击线条
            this.ctx.save();
            
            // 设置线条样式
            this.ctx.strokeStyle = 'rgba(255, 0, 0, ' + (1 - effect.progress) + ')';
            this.ctx.lineWidth = 2;
            
            // 绘制攻击线
            this.ctx.beginPath();
            this.ctx.moveTo(effect.startX, effect.startY);
            
            // 使用二次贝塞尔曲线创建弧形攻击效果
            const controlX = (effect.startX + effect.endX) / 2;
            const controlY = Math.min(effect.startY, effect.endY) - 30;
            
            this.ctx.quadraticCurveTo(
                controlX,
                controlY,
                effect.endX,
                effect.endY
            );
            
            this.ctx.stroke();
            
            // 绘制伤害数字
            this.ctx.fillStyle = 'rgba(255, 0, 0, ' + (1 - effect.progress) + ')';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 让伤害数字向上飘动
            const textY = effect.endY - (effect.progress * 30);
            this.ctx.fillText(
                Math.round(effect.damage).toString(),
                effect.endX,
                textY
            );
            
            this.ctx.restore();
            
            return true; // 保留未完成的效果
        });
    }

    // 添加新方法：创建治疗效果
    createHealEffect(healer, target, amount) {
        const healerPos = this.findUnitPosition(healer);
        const targetPos = this.findUnitPosition(target);
        
        if (!healerPos || !targetPos) return;
        
        this.healEffects.push({
            startX: healerPos.x * this.cellSize + this.cellSize/2,
            startY: healerPos.y * this.cellSize + this.cellSize/2,
            endX: targetPos.x * this.cellSize + this.cellSize/2,
            endY: targetPos.y * this.cellSize + this.cellSize/2,
            progress: 0,
            amount: amount,
            startTime: Date.now()
        });
    }

    // 添加新方法：绘制治疗效果
    drawHealEffects() {
        const currentTime = Date.now();
        const effectDuration = 500;
        
        this.healEffects = this.healEffects.filter(effect => {
            const elapsed = currentTime - effect.startTime;
            effect.progress = elapsed / effectDuration;
            
            if (effect.progress >= 1) return false;
            
            this.ctx.save();
            
            // 设置治疗效果样式（绿色）
            this.ctx.strokeStyle = `rgba(0, 255, 0, ${1 - effect.progress})`;
            this.ctx.lineWidth = 2;
            
            // 绘制治疗线
            this.ctx.beginPath();
            this.ctx.moveTo(effect.startX, effect.startY);
            
            // 使用贝塞尔曲线创建治疗效果
            const controlX = (effect.startX + effect.endX) / 2;
            const controlY = Math.min(effect.startY, effect.endY) - 30;
            
            this.ctx.quadraticCurveTo(
                controlX,
                controlY,
                effect.endX,
                effect.endY
            );
            
            this.ctx.stroke();
            
            // 绘制治疗数字（绿色）
            this.ctx.fillStyle = `rgba(0, 255, 0, ${1 - effect.progress})`;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const textY = effect.endY - (effect.progress * 30);
            this.ctx.fillText(
                `+${Math.round(effect.amount)}`,
                effect.endX,
                textY
            );
            
            this.ctx.restore();
            
            return true;
        });
    }

    // 添加新方法检查图片是否都加载完成
    isImagesLoaded() {
        return this.loadedImages === this.totalImages;
    }

    // 添加等待加载完成的方法
    async waitForLoad() {
        await this.loadingPromise;
    }

    // 添加绘制相关的方法
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 使用 TerrainManager 绘制地形
        this.terrainManager.draw(this.ctx, this.cellSize);
        
        // 绘制单位
        this.drawUnits();
        
        // 绘制效果
        this.drawAttackEffects();
        this.drawHealEffects();
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
        const imageKey = this.typeToImage[unit.type];
        const image = this.unitImages[imageKey];
        
        if (image && image.complete && image.naturalHeight !== 0) {
            // 图片加载成功，绘制图片
            this.ctx.save();
            
            // 如果是右方单位，使用蓝色色调
            if (unit.side === 'right') {
                this.ctx.filter = 'hue-rotate(240deg)';  // 转为蓝色
            }
            
            // 所有单位使用相同大小
            this.ctx.drawImage(
                image,
                centerX,
                centerY,
                this.cellSize,
                this.cellSize
            );
            
            // 绘制血条
            this.drawHealthBar(
                centerX,
                centerY - 5,
                this.cellSize,
                unit
            );
            
            this.ctx.restore();
        } else {
            // 使用备用显示
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
            
            // 绘制血条
            this.drawHealthBar(
                centerX,
                centerY - 5,
                this.cellSize,
                unit
            );
        }
    }

    drawHealthBar(x, y, width, unit) {
        const height = 4;  // 血条高度
        const padding = 1;  // 血条边框padding
        
        // 绘制血条背景（黑色边框）
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x, y, width, height);
        
        // 绘制血条底色（红色）
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(x + padding, y + padding, width - padding * 2, height - padding * 2);
        
        // 计算当前生命值比例
        const healthRatio = unit.hp / unit.maxHp;
        
        // 绘制当前生命值（绿色）
        this.ctx.fillStyle = this.getHealthColor(healthRatio);
        this.ctx.fillRect(
            x + padding,
            y + padding,
            (width - padding * 2) * healthRatio,
            height - padding * 2
        );
    }

    getHealthColor(ratio) {
        if (ratio > 0.5) {
            // 血量大于50%时显示绿色
            return '#00ff00';
        } else if (ratio > 0.25) {
            // 血量大于25%时显示黄色
            return '#ffff00';
        } else {
            // 血量低于25%时显示红色
            return '#ff0000';
        }
    }

    // 添加新方法：处理画布点击
    handleCanvasClick(event) {
        if (!this.pendingUnit) return;
        
        // 获点击位置对应的格子坐标
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.cellSize);
        const y = Math.floor((event.clientY - rect.top) / this.cellSize);
        
        // 获取对应方的基地位置
        const basePos = this.pendingUnitSide === 'left' ? this.leftBasePos : this.rightBasePos;
        
        // 检查是否在基地5格范围内
        const distance = Math.abs(x - basePos.x) + Math.abs(y - basePos.y);
        if (distance <= 5 && this.isValidMove(x, y, this.pendingUnit)) {
            // 放置单位
            this.grid[y][x] = this.pendingUnit;
            console.log(`Placed ${this.pendingUnit.type} at (${x}, ${y})`);
            
            // 隐藏预览
            const preview = document.getElementById(`${this.pendingUnitSide}Preview`);
            preview.style.display = 'none';
            
            // 清除待放置状态
            this.pendingUnit = null;
            this.pendingUnitSide = null;
        } else {
            console.log('Invalid placement position');
        }
    }

    // 添加新方法：设置待放置单位
    setPendingUnit(unit, side) {
        this.pendingUnit = unit;
        this.pendingUnitSide = side;
    }
}

// 在文件末尾添加导出
export { Battlefield }; 