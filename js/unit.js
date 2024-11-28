class Unit {
    constructor(type, side) {
        this.type = type;
        this.side = side;
        
        // 从 UNIT_STATS 获取单位属性
        const stats = UNIT_STATS[type];
        if (stats) {
            this.hp = stats.hp;
            this.attack = stats.attack;
            this.speed = stats.speed;
            this.range = stats.attack_range;
        } else {
            // 默认属性
            this.hp = 1000;
            this.attack = 20;
            this.speed = 1;
            this.range = 2;
        }
        
        // 初始生命值
        this.maxHp = this.hp;
    }
}

// 单位属性数据配置
const UNIT_STATS = {
    "基地": {
        hp: 10000,
        attack: 10,
        move_range: 0,
        attack_range: 4,
        speed: 0
    },
    "士兵": {
        hp: 2000,
        attack: 10,
        move_range: 1,
        attack_range: 1,
        speed: 0.8
    },
    "坦克": {
        hp: 3000,
        attack: 15,
        move_range: 1,
        attack_range: 2,
        speed: 1
    },
    "飞机": {
        hp: 2500,
        attack: 20,
        move_range: 2,
        attack_range: 3,
        speed: 2
    },
    "大炮": {
        hp: 1500,
        attack: 25,
        move_range: 1,
        attack_range: 10,
        speed: 0.5
    },
    "哥斯拉": {
        hp: 5000,
        attack: 100,
        move_range: 1,
        attack_range: 2,
        speed: 0.5
    }
};

// 单位克制关系
const UNIT_COUNTERS = {
    "士兵": ["大炮"],
    "坦克": ["飞机"],
    "飞机": ["大炮"],
    "大炮": ["坦克"],
    "哥斯拉": ["飞机"]
};

// 克制伤害加成
const COUNTER_BONUS = 1.5; 