// 地形类型定义
const TERRAIN_TYPES = {
    PLAIN: 'plain',
    MOUNTAIN: 'mountain',
    WATER: 'water',
    FOREST: 'forest'
};

// 地形效果配置
const TERRAIN_EFFECTS = {
    [TERRAIN_TYPES.PLAIN]: {
        moveModifier: 1,    // 正常移动速度
        attackModifier: 1,  // 正常攻击力
        defenseModifier: 1  // 正常防御力
    },
    [TERRAIN_TYPES.MOUNTAIN]: {
        moveModifier: 0.5,  // 移动速度减半
        attackModifier: 1.2, // 攻击力提升20%
        defenseModifier: 1.3 // 防御力提升30%
    },
    [TERRAIN_TYPES.FOREST]: {
        moveModifier: 0.8,  // 移动速度降低20%
        attackModifier: 1,   // 正常攻击力
        defenseModifier: 1.2 // 防御力提升20%
    },
    [TERRAIN_TYPES.WATER]: {
        moveModifier: 0.3,  // 大幅降低移动速度
        attackModifier: 0.8, // 攻击力降低20%
        defenseModifier: 0.8 // 防御力降低20%
    }
};

// 地形生成配置
const TERRAIN_GENERATION = {
    [TERRAIN_TYPES.PLAIN]: 0.7,     // 70% 概率
    [TERRAIN_TYPES.FOREST]: 0.1,    // 10% 概率
    [TERRAIN_TYPES.MOUNTAIN]: 0.1,  // 10% 概率
    [TERRAIN_TYPES.WATER]: 0.1      // 10% 概率
};

// 地形通行规则
const TERRAIN_MOVEMENT_RULES = {
    [TERRAIN_TYPES.WATER]: {
        canPass: (unit) => unit.type === '飞机' || unit.type === 'UFO'
    },
    [TERRAIN_TYPES.MOUNTAIN]: {
        canPass: (unit) => true
    },
    [TERRAIN_TYPES.FOREST]: {
        canPass: (unit) => true
    },
    [TERRAIN_TYPES.PLAIN]: {
        canPass: (unit) => true
    }
};

class TerrainManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(TERRAIN_TYPES.PLAIN));
        
        // 加载四张完整的地形图
        this.terrainLayers = {
            [TERRAIN_TYPES.PLAIN]: new Image(),
            [TERRAIN_TYPES.MOUNTAIN]: new Image(),
            [TERRAIN_TYPES.WATER]: new Image(),
            [TERRAIN_TYPES.FOREST]: new Image()
        };
        
        // 返回一个 Promise，在所有地形图片加载完成后解析
        this.loadingPromise = new Promise((resolve) => {
            this.loadedLayers = 0;
            this.totalLayers = Object.keys(this.terrainLayers).length;
            
            Object.entries(this.terrainLayers).forEach(([type, img]) => {
                img.onload = () => {
                    this.loadedLayers++;
                    console.log(`Successfully loaded terrain layer: ${type} (${this.loadedLayers}/${this.totalLayers})`);
                    if (this.loadedLayers === this.totalLayers) {
                        console.log('All terrain layers loaded successfully');
                        resolve();
                    }
                };
                img.onerror = (e) => {
                    console.error(`Failed to load terrain layer: ${type}`, e);
                    console.log('Attempted URL:', img.src);
                    // 使用备用颜色
                    this.useFallbackColors = true;
                    // 如果所有图片都加载失败，也要解析 Promise
                    if (++this.loadedLayers === this.totalLayers) {
                        console.log('All terrain layers attempted to load, using fallback colors');
                        resolve();
                    }
                };
            });
        });
        
        // 设置图片源
        console.log('Setting terrain layer sources...');
        Object.entries(this.terrainLayers).forEach(([type, img]) => {
            const src = `assets/terrain/${type.toLowerCase()}_layer.png`;
            console.log(`Loading terrain layer ${type} from: ${src}`);
            img.src = src;
        });
        
        // 标记是否使用备用颜色
        this.useFallbackColors = false;
    }

    generateTerrain(basePositions) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // 跳过基地位置
                if (basePositions.some(pos => pos.x === x && pos.y === y)) {
                    this.grid[y][x] = TERRAIN_TYPES.PLAIN;
                    continue;
                }
                
                // 随机生成地形
                const rand = Math.random();
                let accumulator = 0;
                for (const [type, probability] of Object.entries(TERRAIN_GENERATION)) {
                    accumulator += probability;
                    if (rand < accumulator) {
                        this.grid[y][x] = type;
                        break;
                    }
                }
            }
        }
    }

    getTerrainAt(x, y) {
        return this.grid[y][x];
    }

    canUnitPass(unit, x, y) {
        const terrain = this.getTerrainAt(x, y);
        return TERRAIN_MOVEMENT_RULES[terrain].canPass(unit);
    }

    getTerrainEffects(x, y) {
        const terrain = this.getTerrainAt(x, y);
        return TERRAIN_EFFECTS[terrain];
    }

    draw(ctx, cellSize) {
        console.log('Drawing terrain with:', {
            useFallbackColors: this.useFallbackColors,
            loadedLayers: this.loadedLayers,
            totalLayers: this.totalLayers,
            layerStatus: Object.entries(this.terrainLayers).map(([type, img]) => ({
                type,
                complete: img.complete,
                src: img.src
            }))
        });

        if (this.useFallbackColors) {
            // 如果图片加载失败，使用备用颜色
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const terrain = this.grid[y][x];
                    ctx.fillStyle = this.getFallbackColor(terrain);
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        } else {
            // 绘制每一层地形
            Object.entries(TERRAIN_TYPES).forEach(([_, type]) => {
                const layer = this.terrainLayers[type];
                if (layer.complete) {
                    // 首先绘制整个地形层
                    ctx.drawImage(layer, 0, 0, this.width * cellSize, this.height * cellSize);
                    
                    // 创建一个遮罩层
                    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                    ctx.fillRect(0, 0, this.width * cellSize, this.height * cellSize);
                    
                    // 使用 destination-out 混合模式，只在对应地形的格子上清除遮罩
                    ctx.globalCompositeOperation = 'destination-out';
                    
                    // 清除对应地形格子的遮罩
                    for (let y = 0; y < this.height; y++) {
                        for (let x = 0; x < this.width; x++) {
                            if (this.grid[y][x] === type) {
                                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                            }
                        }
                    }
                    
                    // 恢复默认混合模式
                    ctx.globalCompositeOperation = 'source-over';
                }
            });
        }
    }

    // 添加备用颜色方法
    getFallbackColor(terrain) {
        switch (terrain) {
            case TERRAIN_TYPES.PLAIN:
                return '#90EE90';  // 浅绿色
            case TERRAIN_TYPES.MOUNTAIN:
                return '#808080';  // 灰色
            case TERRAIN_TYPES.WATER:
                return '#4169E1';  // 蓝色
            case TERRAIN_TYPES.FOREST:
                return '#228B22';  // 深绿色
            default:
                return '#FFFFFF';  // 白色
        }
    }

    // 添加加载预设地图的方法
    loadPresetMap(mapId) {
        const presetMaps = {
            'map1': [
                // 这里定义第一张预设地图的布局
                // 每个数组元素代表一行，每个字符代表一个地形
                // p: plain, m: mountain, w: water, f: forest
                "ppppppppppppppppppppppppppppppp",
                "pppppmmmmppppppppppppmmmmpppppp",
                "pppppmmmmppppppppppppmmmmpppppw",
                "pppppmmmmppppppppppppmmmmppppww",
                "ppppppppppppppppppppppppppppwww",
                "fffppppppppppppppppppppppppwwwp",
                "ffffpppppppppppppppppppppwwwwpp",
                "fffffppppppppppppppppppppwwwppp",
                "ffffffpppppppppppppppppwwpppppp",
                "fffffffpppppppppppppppppppppppp",  // 中间行
                "ffffffpppppppppppppppppwwpppppp",
                "fffffppppppppppppppppppppwwwppp",
                "ffffpppppppppppppppppppppwwwwpp",
                "fffppppppppppppppppppppppppwwwp",
                "ppppppppppppppppppppppppppppwww",
                "pppppmmmmppppppppppppmmmmppppww",
                "pppppmmmmppppppppppppmmmmpppppw",
                "pppppmmmmppppppppppppmmmmpppppp",
                "ppppppppppppppppppppppppppppppp",
                "ppppppppppppppppppppppppppppppp"
            ]
        };

        const map = presetMaps[mapId];
        if (!map) {
            console.error(`Map ${mapId} not found`);
            return;
        }

        // 将字符映射到地形类型
        const charToTerrain = {
            'p': TERRAIN_TYPES.PLAIN,
            'm': TERRAIN_TYPES.MOUNTAIN,
            'w': TERRAIN_TYPES.WATER,
            'f': TERRAIN_TYPES.FOREST
        };

        // 加载地图
        for (let y = 0; y < this.height; y++) {
            const row = map[y];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = charToTerrain[row[x]] || TERRAIN_TYPES.PLAIN;
            }
        }
    }
}

// 导出
export { TerrainManager, TERRAIN_TYPES }; 