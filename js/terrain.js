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
        this.terrainImages = this.loadTerrainImages();
    }

    loadTerrainImages() {
        const images = {};
        Object.values(TERRAIN_TYPES).forEach(type => {
            images[type] = new Image();
            images[type].onerror = () => {
                console.error(`Failed to load terrain image: ${type}`);
            };
            images[type].onload = () => {
                console.log(`Successfully loaded terrain image: ${type}`);
            };
            images[type].src = `assets/terrain/${type}.png`;
            console.log(`Attempting to load terrain image: ${type} from ${images[type].src}`);
        });
        return images;
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
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrain = this.grid[y][x];
                const image = this.terrainImages[terrain];
                
                if (!image) {
                    console.error(`No image found for terrain type: ${terrain}`);
                    ctx.fillStyle = this.getFallbackColor(terrain);
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    continue;
                }
                
                if (!image.complete) {
                    console.warn(`Image not yet loaded for terrain: ${terrain}`);
                    ctx.fillStyle = this.getFallbackColor(terrain);
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    continue;
                }
                
                ctx.drawImage(
                    image,
                    x * cellSize,
                    y * cellSize,
                    cellSize,
                    cellSize
                );
            }
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
                "fffppppppppppppppppppppppppwwww",
                "ffffppppppppppppppppppppppwwwww",
                "fffffpppppppppppppppppppppwwwww",
                "ffffffppppppppppppppppppppwwwww",
                "fffffffpppppppppppppppppppwwwww",
                "ffffffppppppppppppppppppppwwwww",
                "fffffpppppppppppppppppppppwwwww",
                "ffffppppppppppppppppppppppwwwww",
                "fffppppppppppppppppppppppppwwww",
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