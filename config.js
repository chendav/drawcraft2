// 从服务器获取配置
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        window.CONFIG = {
            OPENAI_API_KEY: data.apiKey
        };
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

loadConfig(); 