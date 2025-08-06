const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Método para validar contraseñas
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// ✅ Ocultar campos sensibles en todas las respuestas JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  }
});


const User = mongoose.model('User', userSchema);
module.exports = User;

