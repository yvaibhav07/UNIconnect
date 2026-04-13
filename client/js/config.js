// Get the base API URL
const getAPIBase = () => {
    // During local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5001/api';
    }

    // If you deploy the frontend to Vercel and the backend elsewhere,
    // update this URL to your deployed backend API URL.
    // Example: return 'https://your-backend-name.herokuapp.com/api';
    return 'https://your-backend-url.com/api';
};

const API_BASE = getAPIBase();
