const mongoose = require('mongoose');
const crypto = require('crypto');

// Set a more reasonable encryption key length (32 bytes = 256 bits for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
                      'certpilot-secure-encryption-key-32-chars';

const IV_LENGTH = 16; // 16 bytes for AES-256

// Simple encrypt function using AES-256-CBC with better error handling
const encrypt = (text) => {
  try {
    console.log('Encrypting secret key');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', 
                                       Buffer.from(ENCRYPTION_KEY.slice(0, 32)), 
                                       iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

// Simple decrypt function with better error handling
const decrypt = (text) => {
  try {
    console.log('Decrypting secret key');
    // Check if the text contains the expected format (iv:encrypted)
    if (!text || !text.includes(':')) {
      console.error('Invalid encrypted text format');
      return text; // Return original if not in expected format
    }

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', 
                                          Buffer.from(ENCRYPTION_KEY.slice(0, 32)), 
                                          iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
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
    default: 'ap-south-1'
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
        console.log('Encrypting new secret key');
        this.secretAccessKey = encrypt(this.secretAccessKey);
      }
    } catch (error) {
      console.error('Error in pre-save encryption:', error);
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