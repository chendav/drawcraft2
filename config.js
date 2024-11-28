async function loadConfig() {
    try {
        console.log('Fetching config from server...');
        const response = await fetch('/api/config', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
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
        document.body.innerHTML += `<div style="color: red; position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: white; padding: 10px; border: 1px solid red;">
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