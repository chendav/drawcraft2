// 从服务器获取配置
async function loadConfig() {
    try {
        console.log('Fetching config from server...');
        const response = await fetch('/api/config');
        console.log('Server response status:', response.status);
        
        const data = await response.json();
        console.log('Config loaded, API key available:', !!data.apiKey);
        
        window.CONFIG = {
            OPENAI_API_KEY: data.apiKey
        };
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

loadConfig(); 