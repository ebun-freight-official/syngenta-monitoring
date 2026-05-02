const mongoose = require('mongoose')

function isContactPersonField(field) {
  return ['fieldContactPersons', 'receivingContactPersons'].includes(field)
}

const systemSettingsSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: ['trucksDrivers', 'deployments'],
        message: '{VALUE} is not a valid category'
      }
    },
    field: {
      type: String,
      required: [true, 'Field is required'],
      trim: true,
      minlength: [2, 'Field must be at least 2 characters long'],
      maxlength: [100, 'Field cannot exceed 100 characters'],
      match: [
        /^[a-zA-Z0-9\s_-]+$/,
        'Field must contain letters, numbers, spaces, underscores, or hyphens only'
      ]
    },
    values: {
      type: [String],
      default: undefined,
      validate: [
        {
          validator: arr => !arr || arr.length <= 100,
          message: 'Values cannot exceed 100 entries'
        },
        {
          validator: arr =>
            !arr || arr.every(v => typeof v === 'string' && v.trim().length > 0),
          message: 'Each value must be a non-empty string'
        },
        {
          validator: arr => !arr || arr.every(v => v.length <= 100),
          message: 'Each value cannot exceed 100 characters'
        },
        {
          validator: arr =>
            !arr ||
            new Set(arr.map(v => v.trim().toLowerCase())).size === arr.length,
          message: 'Values must not contain duplicates'
        }
      ]
    },
    contactPersonValues: {
      type: [
        {
          _id: false,
          name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
            match: [/^[a-zA-Z\s'.,-]+$/, 'Name must contain letters only']
          },
          contactNo: {
            type: String,
            required: [true, 'Contact number is required'],
            trim: true,
            maxlength: [20, 'Contact number cannot exceed 20 characters'],
            match: [
              /^(?:\+639|09)\d{9}$/,
              'Invalid contact number format'
            ]
          }
        }
      ],
      default: undefined,
      validate: [
        {
          validator: arr => !arr || arr.length <= 100,
          message: 'Contact persons cannot exceed 100 entries'
        },
        {
          validator: arr => {
            if (!arr || arr.length === 0) return true
            const names = arr.map(v => v.name.trim().toLowerCase())
            return new Set(names).size === names.length
          },
          message: 'Contact person names must be unique'
        }
      ]
    }
  },
  { timestamps: true }
)

systemSettingsSchema.pre('validate', function (next) {
  const isContact = isContactPersonField(this.field)
  if (isContact) {
    this.values = undefined
  } else {
    if (!this.values || this.values.length === 0) {
      this.invalidate('values', 'Values must contain at least one entry')
    }
  }
  next()
})

systemSettingsSchema.pre('save', function (next) {
  if (this.values) {
    this.values = this.values.map(v => v.trim())
  }
  if (this.contactPersonValues) {
    this.contactPersonValues = this.contactPersonValues.map(v => ({
      name: v.name.trim(),
      contactNo: v.contactNo.trim()
    }))
  }
  next()
})

systemSettingsSchema.index({ category: 1, field: 1 }, { unique: true })

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema)
module.exports = SystemSettings