const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'certpilot-default-encryption-key-32byte'; // 32 bytes for AES-256
const IV_LENGTH = 16; // 16 bytes for AES-256

// Simple encrypt function using AES-256-CBC
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Simple decrypt function
const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

const AwsCredentialsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessKeyId: {
    type: String,
    required: true
  },
  secretAccessKey: {
    type: String,
    required: true
  },
  region: {
    type: String,
    default: 'us-east-1'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt the AWS secret key before saving
AwsCredentialsSchema.pre('save', function(next) {
  if (this.isModified('secretAccessKey')) {
    try {
      // Don't re-encrypt if already encrypted
      if (!this.secretAccessKey.includes(':')) {
        this.secretAccessKey = encrypt(this.secretAccessKey);
      }
    } catch (error) {
      return next(error);
    }
  }
  this.updatedAt = Date.now();
  next();
});

// Method to get the decrypted secretAccessKey
AwsCredentialsSchema.methods.getDecryptedSecretKey = function() {
  try {
    return decrypt(this.secretAccessKey);
  } catch (error) {
    console.error('Error decrypting AWS secret key:', error);
    return null;
  }
};

module.exports = mongoose.model('AwsCredentials', AwsCredentialsSchema); 