// 从服务器获取配置
async function loadConfig() {
    try {
        console.log('Fetching config from server...');
        const response = await fetch('/api/config');
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Server response data:', data);
        
        if (!data.apiKey) {
            throw new Error('No API key received from server');
        }
        
        window.CONFIG = {
            OPENAI_API_KEY: data.apiKey
        };
        
        console.log('Config loaded successfully');
    } catch (error) {
        console.error('Failed to load config:', error);
        // 添加视觉反馈
        document.body.innerHTML += `<div style="color: red; position: fixed; top: 10px; left: 50%; transform: translateX(-50%);">
            配置加载失败: ${error.message}
        </div>`;
    }
}

// 确保在 DOM 加载完成后再执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
} else {
    loadConfig();
} 