const express = require('express');
const app = express();
const port = 3000;

// 提供静态文件服务
app.use(express.static(__dirname));

// 启动服务器
app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
}); 