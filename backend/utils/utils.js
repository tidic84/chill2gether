export const debugLog = (message) => {
    if (process.env.NODE_ENV !== 'dev') {
        return;
    }
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG] [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
};