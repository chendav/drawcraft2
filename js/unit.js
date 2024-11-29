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
            this.attack_speed = stats.attack_speed;
        } else {
            // 默认属性
            this.hp = 1000;
            this.attack = 20;
            this.speed = 1;
            this.range = 2;
            this.attack_speed = 1;
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
        speed: 0,
        attack_speed: 1
    },
    "防御墙": {
        hp: 8000,
        attack: 5,
        move_range: 0,
        attack_range: 1,
        speed: 0,
        attack_speed: 0.8
    },
    "UFO": {
        hp: 1000,          // 很低的生命值
        attack: 150,       // 很高的攻击力
        move_range: 2,     // 可以移动2格
        attack_range: 3,   // 中等攻击范围
        speed: 2.5,        // 很快的移动速度
        attack_speed: 2    // 很快的攻击速度
    },
    "士兵": {
        hp: 2000,
        attack: 10,
        move_range: 1,
        attack_range: 1,
        speed: 0.8,
        attack_speed: 1.5
    },
    "坦克": {
        hp: 3000,
        attack: 15,
        move_range: 1,
        attack_range: 2,
        speed: 1,
        attack_speed: 1
    },
    "飞机": {
        hp: 2500,
        attack: 20,
        move_range: 2,
        attack_range: 3,
        speed: 2,
        attack_speed: 1.5
    },
    "大炮": {
        hp: 1500,
        attack: 25,
        move_range: 1,
        attack_range: 10,
        speed: 0.5,
        attack_speed: 0.5
    },
    "哥斯拉": {
        hp: 5000,
        attack: 100,
        move_range: 1,
        attack_range: 2,
        speed: 0.5,
        attack_speed: 1
    },
    "骑兵": {
        hp: 2500,          // 比士兵稍高的生命值
        attack: 10,        // 与士兵相同的攻击力
        move_range: 1,
        attack_range: 2,   // 比士兵稍大的攻击范围
        speed: 1,          // 与坦克相同的移动速度
        attack_speed: 1.2  // 较快的攻击速度
    },
    "医疗兵": {
        hp: 1500,          // 较低的生命值
        attack: 0,         // 无攻击力
        move_range: 1,
        attack_range: 3,   // 治疗范围
        speed: 0.8,        // 与士兵相同的移动速度
        attack_speed: 1,   // 治疗速度
        heal_power: 50     // 每次治疗量
    },
    "高达": {
        hp: 4800,          // 与哥斯拉相近的生命值
        attack: 90,        // 与哥斯拉相近的攻击力
        move_range: 1,
        attack_range: 3,   // 比哥斯拉多一格攻击范围
        speed: 0.6,        // 比哥斯拉稍快的移动速度
        attack_speed: 1.2  // 比哥斯拉稍快的攻击速度
    }
};

// 单位克制关系
const UNIT_COUNTERS = {
    "士兵": ["大炮"],
    "坦克": ["飞机"],
    "飞机": ["大炮", "骑兵"],
    "大炮": ["坦克"],
    "哥斯拉": ["飞机"],
    "防御墙": ["大炮"],
    "UFO": ["大炮"],      // 大炮克制UFO
    "骑兵": ["大炮", "士兵"],  // 骑兵克制大炮和士兵
    "飞机": ["骑兵"],           // 飞机克制骑兵
    "医疗兵": [],          // 医疗兵不克制任何单位
    "士兵": ["医疗兵"],    // 士兵克制医疗兵
    "坦克": ["医疗兵"],     // 坦克也克制医疗兵
    "高达": ["UFO"],       // 高达克制UFO
    "哥斯拉": ["高达"]     // 哥斯拉克制高达
};

// 克制伤害加成
const COUNTER_BONUS = 1.5; 