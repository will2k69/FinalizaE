/**
 * Configurações da API do FinalizaE.
 * Talvez seja necessário futuramente ter um arquivo apenas para URL base e outro para endpoints específicos, mas por enquanto isso é suficiente.
 *
 * Localhost: 'http://localhost:8000'
 * Produção (server address):  'https://finalizae-api.onrender.com'
 *
 */
const _isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL = _isLocal
    ? 'http://localhost:8000'
    : 'https://finalizae-api.onrender.com';
