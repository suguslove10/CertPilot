const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subdomainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subdomain',
    required: false
  },
  domain: {
    type: String,
    required: true
  },
  isMainDomain: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'issued', 'installed', 'error', 'expired'],
    default: 'pending'
  },
  issueDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  installDate: {
    type: Date,
    default: null
  },
  certPath: {
    type: String,
    default: null
  },
  keyPath: {
    type: String,
    default: null
  },
  chainPath: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  installWarnings: {
    type: Array,
    default: []
  },
  renewalStatus: {
    type: String,
    enum: ['not_scheduled', 'scheduled', 'in_progress', 'failed'],
    default: 'not_scheduled'
  },
  // New fields for Certificate Lifecycle Management
  alertSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: {
      type: [Number],
      default: [30, 14, 7, 3, 1] // Days before expiry
    },
    channels: [{
      type: {
        type: String,
        enum: ['email', 'webhook', 'in-app'],
        required: true
      },
      destination: String // email address or webhook URL
    }]
  },
  alertHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    threshold: Number,
    channel: String,
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true
    },
    message: String
  }],
  renewalHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true
    },
    provider: {
      type: String,
      default: 'letsencrypt'
    },
    error: String,
    nextRenewalDate: Date
  }],
  // Certificate inventory management fields
  tags: [String],
  category: String,
  owner: String,
  notes: String,
  customFields: [{
    key: String,
    value: String
  }],
  lastCheckDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', CertificateSchema); 