// src/utils/omitMeta.js
// Limpia __v/createdAt/updatedAt, stringifica ObjectId y elimina llaves internas de Mongoose.

function isPlainObject(v) {
  return Object.prototype.toString.call(v) === '[object Object]';
}

function isObjectId(v) {
  // Mongoose o driver nativo
  return v && (v._bsontype === 'ObjectID' || typeof v.toHexString === 'function');
}

function isMongooseDoc(v) {
  // Heurística segura: los documentos tienen $__ y toObject()
  return v && typeof v.toObject === 'function' && v.$__ != null;
}

function omitMeta(value, extraKeys = []) {
  const META_KEYS = new Set(['__v', 'createdAt', 'updatedAt', ...extraKeys]);
  const INTERNAL_KEYS = new Set(['$__', '$isNew', '_doc']); // llaves internas de Mongoose

  if (Array.isArray(value)) {
    return value.map((v) => omitMeta(v, extraKeys));
  }

  // ObjectId -> string
  if (isObjectId(value)) {
    try { return value.toString(); } catch { return String(value); }
  }

  // Documento de Mongoose -> convertir a objeto plano primero
  if (isMongooseDoc(value)) {
    const plain = value.toObject({
      virtuals: false,
      getters: false,
      versionKey: false, // elimina __v aquí también
      depopulate: true,
      transform: (_, ret) => ret,
    });
    return omitMeta(plain, extraKeys);
  }

  // No tocar Date, Buffer, etc.
  if (!isPlainObject(value)) {
    return value;
  }

  // Objeto plano: eliminar metacampos e internos
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (META_KEYS.has(k)) continue;
    if (INTERNAL_KEYS.has(k)) continue;
    if (k.startsWith('$')) continue; // por si aparece otra interna
    out[k] = omitMeta(v, extraKeys);
  }
  return out;
}

module.exports = omitMeta;
