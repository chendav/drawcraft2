class Unit {
    constructor(type, side) {
        this.type = type;
        this.side = side;
        
        // 设置单位属性
        switch(type) {
            case '士兵':
                this.hp = 1000;
                this.attack = 20;
                this.speed = 2;
                this.range = 2;
                break;
            case '坦克':
                this.hp = 2000;
                this.attack = 40;
                this.speed = 1;
                this.range = 3;
                break;
            case '飞机':
                this.hp = 1500;
                this.attack = 30;
                this.speed = 3;
                this.range = 4;
                break;
            case '大炮':
                this.hp = 1200;
                this.attack = 50;
                this.speed = 0;
                this.range = 5;
                break;
            case '哥斯拉':
                this.hp = 5000;
                this.attack = 100;
                this.speed = 0.5;
                this.range = 2;
                break;
            default:
                this.hp = 1000;
                this.attack = 20;
                this.speed = 1;
                this.range = 2;
        }
        
        // 初始生命值
        this.maxHp = this.hp;
    }
    
    // ... 其他方法保持不变 ...
}

// 单位属性数据配置
const UNIT_STATS = {
    "基地": {
        hp: 10000,
        attack: 0,
        move_range: 0,
        attack_range: 0,
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
        attack_range: 4,
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