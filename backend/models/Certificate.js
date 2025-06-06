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
    required: true
  },
  domain: {
    type: String,
    required: true
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', CertificateSchema); 