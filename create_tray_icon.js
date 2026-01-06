const fs = require('fs');
const path = require('path');

const base64Data = `iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAAAAADYBvDeAAAAKElEQVR4nO3NMQ0AAAgDsMnGKXamgoOkSf8ms7cEAoFAIBAIBALBl6BMBjxMcH5eXgAAAABJRU5E6iRg9w==`;

const buffer = Buffer.from(base64Data, 'base64');
fs.writeFileSync(path.join(__dirname, 'src/main/tray.png'), buffer);
console.log('Tray icon created.');