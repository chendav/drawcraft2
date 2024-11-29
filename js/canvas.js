export class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        
        // 设置画笔样式
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        
        // 触摸支持
        this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
        this.canvas.addEventListener('touchmove', this.draw.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    startDrawing(e) {
        e.preventDefault();  // 防止触摸设备上的滚动
        this.isDrawing = true;
        let pos = this.getPosition(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }

    draw(e) {
        e.preventDefault();  // 防止触摸设备上的滚动
        if (!this.isDrawing) return;
        let pos = this.getPosition(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    getPosition(e) {
        let rect = this.canvas.getBoundingClientRect();
        let x, y;
        
        if (e.touches) {  // 触摸事件
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {  // 鼠标事件
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        // 确保坐标在画布范围内
        x = Math.max(0, Math.min(x, this.canvas.width));
        y = Math.max(0, Math.min(y, this.canvas.height));
        
        return {x, y};
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getImageData() {
        // 检查画布是否为空
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        let isEmpty = true;
        for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] !== 0) {
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            console.log("Canvas is empty!");
            return null;
        }
        
        // 返回非空画布的数据URL
        try {
            // 创建一个临时画布来处理背景
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // 填充白色背景
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 将原画布内容绘制到临时画布上
            tempCtx.drawImage(this.canvas, 0, 0);
            
            // 返回带有白色背景的图像数据
            return tempCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error converting canvas to image:', error);
            return null;
        }
    }
} 