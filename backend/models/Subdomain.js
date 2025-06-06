const mongoose = require('mongoose');

const SubdomainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  parentDomain: {
    type: String,
    required: true,
    trim: true
  },
  hostedZoneId: {
    type: String,
    required: true
  },
  targetIp: {
    type: String,
    required: true
  },
  recordType: {
    type: String,
    enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT'],
    default: 'A'
  },
  ttl: {
    type: Number,
    default: 300
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

// Update timestamp on save
SubdomainSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Subdomain', SubdomainSchema); 