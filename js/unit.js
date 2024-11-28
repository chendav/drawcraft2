class Unit {
    constructor(type, side) {
        this.type = type;
        this.side = side;
        const stats = UNIT_STATS[type] || {};
        this.hp = stats.hp || 100;
        this.attack = stats.attack || 10;
        this.move_range = stats.move_range || 2;
        this.attack_range = stats.attack_range || 1;
        this.speed = stats.speed || 1;
    }
}

// 单位属性数据配置
const UNIT_STATS = {
    "基地": {
        hp: 1000,
        attack: 0,
        move_range: 0,
        attack_range: 0,
        speed: 0
    },
    "士兵": {
        hp: 200,
        attack: 10,
        move_range: 1,
        attack_range: 1,
        speed: 0.8
    },
    "坦克": {
        hp: 300,
        attack: 15,
        move_range: 1,
        attack_range: 2,
        speed: 1
    },
    "飞机": {
        hp: 250,
        attack: 20,
        move_range: 2,
        attack_range: 3,
        speed: 2
    },
    "大炮": {
        hp: 150,
        attack: 25,
        move_range: 1,
        attack_range: 4,
        speed: 0.5
    }
};

// 单位克制关系
const UNIT_COUNTERS = {
    "士兵": ["大炮"],
    "坦克": ["飞机"],
    "飞机": ["大炮"],
    "大炮": ["坦克"]
};

// 克制伤害加成
const COUNTER_BONUS = 1.5; 