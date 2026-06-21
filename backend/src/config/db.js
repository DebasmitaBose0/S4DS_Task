require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Synchronously determine if we need the local JSON file database fallback
const mongoURI = process.env.MONGODB_URI;
let isMockDB = !mongoURI;

const MOCK_DB_DIR = path.join(__dirname, '../../data');

// Simple file-based database fallback that mimics Mongoose models
class MockModel {
  constructor(name, schema) {
    this.name = name;
    this.schema = schema;
    this.filePath = path.join(MOCK_DB_DIR, `${name.toLowerCase()}s.json`);
    this.initFile();
  }

  initFile() {
    if (!fs.existsSync(MOCK_DB_DIR)) {
      fs.mkdirSync(MOCK_DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      return [];
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    const items = this.read();
    return items.filter(item => {
      for (let key in query) {
        if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, query[key].$options || '');
          if (!regex.test(item[key])) return false;
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = this.read();
    const found = items.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    return found ? { ...found, save: async function() {
      const all = fs.readFileSync(path.join(MOCK_DB_DIR, `${this.constructor.name.toLowerCase()}s.json`), 'utf8');
      const parsed = JSON.parse(all);
      const idx = parsed.findIndex(x => x._id === this._id);
      if (idx !== -1) {
        parsed[idx] = { ...this };
        delete parsed[idx].save;
        fs.writeFileSync(path.join(MOCK_DB_DIR, `${this.constructor.name.toLowerCase()}s.json`), JSON.stringify(parsed, null, 2));
      }
      return this;
    }.bind(found) } : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const items = this.read();
    const newItem = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this.write(items);
    return newItem;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this.read();
    const idx = items.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const updatedItem = {
      ...items[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    items[idx] = updatedItem;
    this.write(items);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const items = this.read();
    const idx = items.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const deleted = items[idx];
    items.splice(idx, 1);
    this.write(items);
    return deleted;
  }

  async deleteMany(query = {}) {
    this.write([]);
    return { deletedCount: 0 };
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log('⚠️  No MONGODB_URI environment variable detected. Running in Mock JSON Database mode.');
    isMockDB = true;
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas / Local Server');
  } catch (error) {
    console.error('❌ MongoDB Connection failed. Falling back to Mock JSON Database mode.', error.message);
    isMockDB = true;
  }
};

const getModel = (name, schemaDefinition) => {
  if (isMockDB) {
    return new MockModel(name, schemaDefinition);
  }
  // Mongoose fallback
  const schema = new mongoose.Schema(schemaDefinition, { timestamps: true });
  return mongoose.models[name] || mongoose.model(name, schema);
};

module.exports = { connectDB, getModel, getIsMock: () => isMockDB };
