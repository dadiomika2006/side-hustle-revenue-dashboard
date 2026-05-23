const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../local_db.json');

// Helper to read database JSON
function readDB() {
  if (!fs.existsSync(dbPath)) {
    const initial = {
      users: [],
      transactions: [],
      clients: [],
      invoices: [],
      goals: [],
      taxbuckets: [],
      mileagelogs: [],
      receipts: [],
      recurringtransactions: [],
      reminders: [],
      incomestreams: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (err) {
    console.error('Error reading mock database file:', err);
    return {};
  }
}

// Helper to write database JSON
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to mock database file:', err);
  }
}

// Map database collection names
const registeredModels = {};

// Helper to match mongo query selector structures against a document item
function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or') {
      if (!Array.isArray(val)) return false;
      return val.some(subQuery => matchQuery(item, subQuery));
    }
    if (key === '$and') {
      if (!Array.isArray(val)) return false;
      return val.every(subQuery => matchQuery(item, subQuery));
    }
    
    const itemVal = item[key];
    
    if (val && typeof val === 'object') {
      // Handle operators inside objects like { $exists: true } or { $ne: null } or { $gte: Date }
      let matchObj = true;
      if (val.hasOwnProperty('$exists')) {
        const exists = val.$exists;
        const isDefined = itemVal !== undefined && itemVal !== null;
        if (exists && !isDefined) matchObj = false;
        if (!exists && isDefined) matchObj = false;
      }
      if (val.hasOwnProperty('$ne')) {
        const neVal = val.$ne;
        if (neVal === null) {
          if (itemVal === null || itemVal === undefined) matchObj = false;
        } else if (itemVal !== undefined && itemVal !== null && itemVal.toString() === neVal.toString()) {
          matchObj = false;
        }
      }
      if (val.hasOwnProperty('$gte')) {
        const gteVal = val.$gte;
        if (gteVal instanceof Date) {
          if (new Date(itemVal) < gteVal) matchObj = false;
        } else if (typeof gteVal === 'string' || typeof gteVal === 'number') {
          if (itemVal < gteVal) matchObj = false;
        }
      }
      if (val.hasOwnProperty('$lte')) {
        const lteVal = val.$lte;
        if (lteVal instanceof Date) {
          if (new Date(itemVal) > lteVal) matchObj = false;
        } else if (typeof lteVal === 'string' || typeof lteVal === 'number') {
          if (itemVal > lteVal) matchObj = false;
        }
      }
      if (!matchObj) return false;
      continue;
    }
    
    // Standard value comparison
    if (val === null || val === undefined) {
      if (itemVal !== null && itemVal !== undefined) return false;
    } else if (itemVal === undefined || itemVal === null) {
      return false;
    } else {
      // Handle ObjectId representation vs plain string id comparison
      if (itemVal.toString() !== val.toString()) {
        return false;
      }
    }
  }
  
  return true;
}

// Chainable mock Query builder class
class MockQuery {
  constructor(collectionName, query, mode = 'many') {
    this.collectionName = collectionName;
    this.query = query;
    this.mode = mode;
    this._sort = null;
    this._limit = null;
    this._skip = null;
    this._populate = [];
    this._select = null;
  }
  
  sort(s) {
    this._sort = s;
    return this;
  }
  
  limit(l) {
    this._limit = l;
    return this;
  }

  skip(s) {
    this._skip = s;
    return this;
  }
  
  populate(path, fields) {
    this._populate.push({ path, fields });
    return this;
  }
  
  select(fields) {
    this._select = fields;
    return this;
  }
  
  async exec() {
    const db = readDB();
    let col = db[this.collectionName] || [];
    
    // Filter items
    let results = col.filter(x => matchQuery(x, this.query));
    
    // Sort items
    if (this._sort) {
      const [field, dir] = Object.entries(this._sort)[0];
      results.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        if (typeof aVal === 'string' && !isNaN(Date.parse(aVal))) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        if (aVal < bVal) return dir === -1 ? 1 : -1;
        if (aVal > bVal) return dir === -1 ? -1 : 1;
        return 0;
      });
    }
    
    // Apply skip and limit
    let skipVal = this._skip || 0;
    if (this._limit !== null && this._limit !== undefined) {
      results = results.slice(skipVal, skipVal + this._limit);
    } else if (skipVal > 0) {
      results = results.slice(skipVal);
    }
    
    // Apply populate
    for (const pop of this._populate) {
      let pathName = pop.path;
      // Resolve collections by appending 's' (e.g. client -> clients)
      let foreignColName = pathName.toLowerCase() + 's';
      if (pathName === 'incomeStream') foreignColName = 'incomestreams';
      const foreignData = db[foreignColName] || [];
      
      results = results.map(item => {
        const idToFind = item[pathName];
        if (!idToFind) return item;
        const found = foreignData.find(x => x._id === idToFind.toString());
        return {
          ...item,
          [pathName]: found ? { ...found, id: found._id } : idToFind
        };
      });
    }
    
    const ModelClass = registeredModels[this.collectionName];
    const models = results.map(x => ModelClass ? new ModelClass(x) : x);
    
    if (this.mode === 'one') {
      return models[0] || null;
    }
    return models;
  }
  
  then(onSuccess, onError) {
    return this.exec().then(onSuccess, onError);
  }
  
  catch(onError) {
    return this.exec().catch(onError);
  }
}

// Mock Mongoose Schema constructor
class Schema {
  constructor(definition, options) {
    this.definition = definition;
    this.options = options;
    this.methods = {};
    this.statics = {};
    this._pres = {};
  }
  
  pre(hook, fn) {
    this._pres[hook] = fn;
  }
}

Schema.Types = {
  ObjectId: 'ObjectId',
  String: 'String',
  Number: 'Number',
  Boolean: 'Boolean',
  Date: 'Date',
  Array: 'Array'
};

const Types = {
  ObjectId: class ObjectId {
    constructor(id) {
      this.id = id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    toString() {
      return this.id.toString();
    }
  }
};

// Main mongoose interface mock
const mockMongoose = {
  Schema,
  Types,
  connection: {
    readyState: 1,
    on: () => {},
    once: () => {}
  },
  
  connect: async () => {
    console.log('Mock database system successfully initialized in Offline/Local Mode! 💾');
    return true;
  },
  
  model: function(name, schema) {
    // Standard plural name conversion
    let collectionName = name.toLowerCase() + 's';
    if (name === 'IncomeStream') collectionName = 'incomestreams';
    if (name === 'TaxBucket') collectionName = 'taxbuckets';
    if (name === 'RecurringTransaction') collectionName = 'recurringtransactions';
    if (name === 'Mileage') collectionName = 'mileagelogs';
    
    class Model {
      constructor(data) {
        Object.assign(this, data);
        if (!this._id) {
          this._id = new Types.ObjectId().toString();
        }
        if (!this.createdAt) {
          this.createdAt = new Date().toISOString();
        }
        this.updatedAt = new Date().toISOString();
      }

      isModified(path) {
        if (path === 'password' && this.password) {
          // If the password starts with standard bcrypt hash prefixes, it's already hashed
          return !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$');
        }
        return true;
      }

      async populate(paths) {
        const db = readDB();
        const popPaths = Array.isArray(paths) ? paths : [paths];
        
        for (const pop of popPaths) {
          let pathName = typeof pop === 'string' ? pop : pop.path;
          // Resolve collections by appending 's' (e.g. client -> clients)
          let foreignColName = pathName.toLowerCase() + 's';
          if (pathName === 'incomeStream') foreignColName = 'incomestreams';
          const foreignData = db[foreignColName] || [];
          
          const idToFind = this[pathName];
          if (idToFind) {
            const found = foreignData.find(x => x._id === idToFind.toString());
            this[pathName] = found ? { ...found, id: found._id } : idToFind;
          }
        }
        return this;
      }
      
      async save() {
        // Run pre-save hooks (like password hashing)
        if (schema && schema._pres && typeof schema._pres['save'] === 'function') {
          // Binding this to instance, passing a dummy next callback to avoid TypeError
          await schema._pres['save'].call(this, () => {});
        }
        
        const db = readDB();
        if (!db[collectionName]) db[collectionName] = [];
        
        const idx = db[collectionName].findIndex(x => x._id === this._id.toString());
        const plainObject = { ...this };
        
        // Exclude prototype helper functions
        for (const key of Object.keys(plainObject)) {
          if (typeof plainObject[key] === 'function') {
            delete plainObject[key];
          }
        }
        
        if (idx >= 0) {
          db[collectionName][idx] = {
            ...db[collectionName][idx],
            ...plainObject,
            updatedAt: new Date().toISOString()
          };
        } else {
          db[collectionName].push(plainObject);
        }
        
        writeDB(db);
        return this;
      }
      
      toObject() {
        return { ...this };
      }
      
      toJSON() {
        if (schema && schema.methods && typeof schema.methods.toJSON === 'function') {
          return schema.methods.toJSON.call(this);
        }
        const obj = { ...this };
        delete obj.password;
        return obj;
      }
    }
    
    // Register prototype custom methods (like comparePassword)
    if (schema && schema.methods) {
      for (const [mName, mFn] of Object.entries(schema.methods)) {
        Model.prototype[mName] = mFn;
      }
    }
    
    // Register static query functions
    Model.find = function(query) {
      return new MockQuery(collectionName, query, 'many');
    };
    
    Model.findOne = function(query) {
      return new MockQuery(collectionName, query, 'one');
    };
    
    Model.findById = function(id) {
      const idStr = id ? id.toString() : '';
      return new MockQuery(collectionName, { _id: idStr }, 'one');
    };
    
    Model.create = async function(doc) {
      if (Array.isArray(doc)) {
        const instances = [];
        for (const d of doc) {
          const inst = new Model(d);
          await inst.save();
          instances.push(inst);
        }
        return instances;
      } else {
        const inst = new Model(doc);
        await inst.save();
        return inst;
      }
    };
    
    Model.findByIdAndUpdate = async function(id, update, options) {
      const db = readDB();
      const col = db[collectionName] || [];
      const idStr = id ? id.toString() : '';
      const idx = col.findIndex(x => x._id === idStr);
      if (idx < 0) return null;
      
      let updateObj = update;
      if (update && update.$set) {
        updateObj = { ...updateObj, ...update.$set };
        delete updateObj.$set;
      }
      
      col[idx] = {
        ...col[idx],
        ...updateObj,
        updatedAt: new Date().toISOString()
      };
      
      db[collectionName] = col;
      writeDB(db);
      return new Model(col[idx]);
    };
    
    Model.findByIdAndDelete = async function(id) {
      const db = readDB();
      const col = db[collectionName] || [];
      const idStr = id ? id.toString() : '';
      const item = col.find(x => x._id === idStr);
      if (!item) return null;
      
      db[collectionName] = col.filter(x => x._id !== idStr);
      writeDB(db);
      return new Model(item);
    };
    
    Model.deleteOne = async function(query) {
      const db = readDB();
      const col = db[collectionName] || [];
      const idx = col.findIndex(x => matchQuery(x, query));
      if (idx < 0) return { deletedCount: 0 };
      
      col.splice(idx, 1);
      db[collectionName] = col;
      writeDB(db);
      return { deletedCount: 1 };
    };
    
    Model.deleteMany = async function(query) {
      const db = readDB();
      const col = db[collectionName] || [];
      const initialLen = col.length;
      const remaining = col.filter(x => !matchQuery(x, query));
      
      db[collectionName] = remaining;
      writeDB(db);
      return { deletedCount: initialLen - remaining.length };
    };
    
    Model.countDocuments = async function(query) {
      const db = readDB();
      const col = db[collectionName] || [];
      if (!query || Object.keys(query).length === 0) return col.length;
      return col.filter(x => matchQuery(x, query)).length;
    };
    
    Model.aggregate = async function(pipeline) {
      const db = readDB();
      let data = db[collectionName] || [];
      
      for (const stage of pipeline) {
        if (stage.$match) {
          data = data.filter(x => matchQuery(x, stage.$match));
        } else if (stage.$group) {
          const groupKey = stage.$group._id;
          const groups = {};
          
          for (const item of data) {
            let keyVal = 'null';
            let evaluatedId = null;
            if (groupKey && groupKey !== 'null') {
              if (typeof groupKey === 'object') {
                if (groupKey.$month) {
                  const dateField = groupKey.$month.replace('$', '');
                  const dateStr = item[dateField];
                  evaluatedId = dateStr ? new Date(dateStr).getMonth() + 1 : 1;
                  keyVal = String(evaluatedId);
                } else {
                  // It's a compound object like { client: '$client', type: '$type' }
                  const evaluatedObj = {};
                  for (const [k, v] of Object.entries(groupKey)) {
                    if (typeof v === 'string' && v.startsWith('$')) {
                      const field = v.replace('$', '');
                      evaluatedObj[k] = item[field] !== undefined && item[field] !== null ? item[field].toString() : null;
                    } else {
                      evaluatedObj[k] = v;
                    }
                  }
                  evaluatedId = evaluatedObj;
                  keyVal = JSON.stringify(evaluatedObj);
                }
              } else if (typeof groupKey === 'string' && groupKey.startsWith('$')) {
                const groupField = groupKey.replace('$', '');
                evaluatedId = item[groupField] !== undefined && item[groupField] !== null ? item[groupField].toString() : 'null';
                keyVal = String(evaluatedId);
              }
            } else {
              evaluatedId = null;
              keyVal = 'null';
            }
            
            if (!groups[keyVal]) {
              groups[keyVal] = { _id: evaluatedId };
              // Initialize other grouped accumulator fields (e.g. revenue, expenses, total)
              for (const [gKey, gVal] of Object.entries(stage.$group)) {
                if (gKey === '_id') continue;
                if (gVal.$sum) {
                  groups[keyVal][gKey] = 0;
                }
              }
            }
            
            // Accumulate sums
            for (const [gKey, gVal] of Object.entries(stage.$group)) {
              if (gKey === '_id') continue;
              if (gVal.$sum) {
                let sumExpr = gVal.$sum;
                let addVal = 0;
                if (typeof sumExpr === 'number') {
                  addVal = sumExpr;
                } else if (typeof sumExpr === 'string' && sumExpr.startsWith('$')) {
                  const field = sumExpr.replace('$', '');
                  addVal = Number(item[field]) || 0;
                } else if (typeof sumExpr === 'object' && sumExpr.$ifNull) {
                  const [expr1, expr2] = sumExpr.$ifNull;
                  const f1 = expr1.replace('$', '');
                  const val1 = item[f1];
                  
                  if (val1 !== undefined && val1 !== null) {
                    addVal = Number(val1) || 0;
                  } else {
                    addVal = typeof expr2 === 'number' ? expr2 : Number(item[expr2.replace('$', '')]) || 0;
                  }
                }
                groups[keyVal][gKey] += addVal;
              }
            }
          }
          data = Object.values(groups);
        } else if (stage.$lookup) {
          const fromCol = stage.$lookup.from;
          const localField = stage.$lookup.localField;
          const foreignField = stage.$lookup.foreignField;
          const asField = stage.$lookup.as;
          
          const foreignData = db[fromCol] || [];
          
          data = data.map(item => {
            const localVal = item[localField] ? item[localField].toString() : '';
            const matching = foreignData.filter(f => f[foreignField] && f[foreignField].toString() === localVal);
            return {
              ...item,
              [asField]: matching
            };
          });
        } else if (stage.$sort) {
          const [sortField, sortDir] = Object.entries(stage.$sort)[0];
          data.sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal < bVal) return sortDir === 1 ? -1 : 1;
            if (aVal > bVal) return sortDir === 1 ? 1 : -1;
            return 0;
          });
        } else if (stage.$limit) {
          data = data.slice(0, stage.$limit);
        }
      }
      return data;
    };
    
    registeredModels[collectionName] = Model;
    return Model;
  }
};

module.exports = mockMongoose;
