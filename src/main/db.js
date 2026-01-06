const path = require('path');
const { app } = require('electron');
const fs = require('fs-extra');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'history.json');

// In-memory cache
let cachedData = null;

// Initialize
if (!fs.existsSync(dbPath)) {
  fs.writeJsonSync(dbPath, []);
}

function loadData() {
  if (cachedData) return cachedData;
  try {
    cachedData = fs.readJsonSync(dbPath);
  } catch {
    cachedData = [];
  }
  return cachedData;
}

function saveData(data) {
  cachedData = data;
  try {
      fs.writeJsonSync(dbPath, data);
  } catch (e) {
      console.error("Save DB failed", e);
  }
}

function saveImage(buffer) {
  const imagesDir = path.join(userDataPath, 'images');
  fs.ensureDirSync(imagesDir);
  const filename = `${Date.now()}.png`;
  const filePath = path.join(imagesDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = {
  saveImage,
  
  addHistory: async (type, content, preview) => {
    const data = loadData();
    const newItem = {
      id: Date.now(),
      type,
      content,
      preview,
      created_at: new Date().toISOString(),
      is_favorite: 0
    };
    data.unshift(newItem);
    saveData(data);
    return { id: newItem.id };
  },

  getHistory: async (limit = 50, offset = 0) => {
    let data = loadData();
    // Sort
    data.sort((a, b) => {
      // Sort by Favorite DESC
      if (a.is_favorite !== b.is_favorite) return b.is_favorite - a.is_favorite;
      // Then by Date DESC
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    return data.slice(offset, offset + limit);
  },

  searchHistory: async (query) => {
    const data = loadData();
    const lowerQ = query.toLowerCase();
    const results = data.filter(item => {
        if (item.type === 'text' && item.content.toLowerCase().includes(lowerQ)) return true;
        return false;
    });
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return results;
  },

  deleteItem: async (id) => {
    let data = loadData();
    data = data.filter(i => i.id !== id);
    saveData(data);
  },

  toggleFavorite: async (id) => {
    const data = loadData();
    const item = data.find(i => i.id === id);
    if (item) {
        item.is_favorite = item.is_favorite ? 0 : 1;
        saveData(data);
    }
  },

  clearHistory: async () => {
    let data = loadData();
    data = data.filter(i => i.is_favorite); // Keep favorites
    saveData(data);
  },

  pruneHistory: async (limit) => {
    let data = loadData();
    const favorites = data.filter(i => i.is_favorite);
    let others = data.filter(i => !i.is_favorite);
    
    others.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (others.length > limit) {
        others = others.slice(0, limit);
    }
    
    const newData = [...favorites, ...others];
    // No need to sort fully here, getHistory does it.
    saveData(newData);
  }
};