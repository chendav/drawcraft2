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
        this.terrainLayers[TERRAIN_TYPES.PLAIN].src = 'assets/terrain/plain_layer.png';
        this.terrainLayers[TERRAIN_TYPES.MOUNTAIN].src = 'assets/terrain/mountain_layer.png';
        this.terrainLayers[TERRAIN_TYPES.WATER].src = 'assets/terrain/water_layer.png';
        this.terrainLayers[TERRAIN_TYPES.FOREST].src = 'assets/terrain/forest_layer.png';
        
        // 标记是否使用备用颜色
        this.useFallbackColors = true;  // 默认使用备用颜色，直到图片加载成功
        
        // 加载预设地图
        this.loadPresetMap('map1');
    }

    draw(ctx, cellSize) {
        // 绘制每一层地形
        Object.entries(TERRAIN_TYPES).forEach(([_, type]) => {
            const layer = this.terrainLayers[type];
            if (layer.complete) {
                ctx.save();  // 保存当前状态
                
                // 设置整个图层为完全透明
                ctx.globalAlpha = 0;  // 100%透明
                
                // 绘制整个地形层
                ctx.drawImage(layer, 0, 0, this.width * cellSize, this.height * cellSize);
                
                // 恢复完全不透明，只绘制对应地形的格子
                ctx.globalAlpha = 1.0;
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        if (this.grid[y][x] === type) {
                            // 只绘制这个格子的部分
                            ctx.drawImage(
                                layer,
                                x * cellSize,     // 源图像x
                                y * cellSize,     // 源图像y
                                cellSize,         // 源图像宽度
                                cellSize,         // 源图像高度
                                x * cellSize,     // 目标x
                                y * cellSize,     // 目标y
                                cellSize,         // 目标宽度
                                cellSize          // 目标高度
                            );
                        }
                    }
                }
                
                ctx.restore();  // 恢复之前的状态
            } else if (this.useFallbackColors) {
                // 如果图片未加载，使用备用颜色
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        if (this.grid[y][x] === type) {
                            ctx.fillStyle = this.getFallbackColor(type);
                            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        }
                    }
                }
            }
        });
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

    // 修改 loadPresetMap 方法，添加调试信息
    loadPresetMap(mapId) {
        console.log('Loading preset map:', mapId);
        const presetMaps = {
            'map1': [
                // ... 地图数据保持不变 ...
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

        console.log('Terrain mapping:', charToTerrain);

        // 加载地图
        for (let y = 0; y < this.height; y++) {
            const row = map[y];
            for (let x = 0; x < this.width; x++) {
                const terrainType = charToTerrain[row[x]] || TERRAIN_TYPES.PLAIN;
                console.log(`Setting terrain at (${x}, ${y}):`, {
                    char: row[x],
                    terrainType
                });
                this.grid[y][x] = terrainType;
            }
        }

        console.log('Map loaded:', this.grid);
    }

    // 添加单位通行检查方法
    canUnitPass(unit, x, y) {
        const terrain = this.grid[y][x];
        
        // 如果没有找到地形类型，默认为平原
        if (!terrain) {
            return true;
        }
        
        // 使用地形通行规则检查
        const rule = TERRAIN_MOVEMENT_RULES[terrain];
        if (!rule) {
            console.warn(`No movement rule found for terrain: ${terrain}`);
            return true;
        }
        
        return rule.canPass(unit);
    }
}

// 导出所有需要的常量和类
export { 
    TerrainManager, 
    TERRAIN_TYPES,
    TERRAIN_EFFECTS,
    TERRAIN_GENERATION,
    TERRAIN_MOVEMENT_RULES 
}; 