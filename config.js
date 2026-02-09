// Configuration for different environments
const config = {
    // Development environment
    development: {
        apiUrl: 'http://127.0.0.1:5000/api',
        frontendUrl: 'http://127.0.0.1:8000'
    },
    
    // Production environment (Render)
    production: {
        apiUrl: 'https://portfolio-backend.onrender.com/api',
        frontendUrl: 'https://portfolio-frontend.onrender.com'
    }
};

// Detect environment
const isProduction = window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost';

// Export appropriate configuration
const currentConfig = isProduction ? config.production : config.development;

// Make available globally
window.API_BASE_URL = currentConfig.apiUrl;
window.FRONTEND_URL = currentConfig.frontendUrl;

console.log('Environment:', isProduction ? 'production' : 'development');
console.log('API URL:', window.API_BASE_URL);
