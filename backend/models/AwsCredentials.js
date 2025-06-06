const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
AwsCredentialsSchema.pre('save', async function(next) {
  if (this.isModified('secretAccessKey')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.secretAccessKey = await bcrypt.hash(this.secretAccessKey, salt);
    } catch (error) {
      return next(error);
    }
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AwsCredentials', AwsCredentialsSchema); 