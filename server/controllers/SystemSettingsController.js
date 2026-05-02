const SystemSettings = require('../models/systemSettingsModel')
const createError = require('http-errors')
const ActivityLog = require('../models/activityLogsModel')

const CONTACT_PERSON_FIELDS = ['fieldContactPersons', 'receivingContactPersons']

function isContactPersonField(field) {
  return CONTACT_PERSON_FIELDS.includes(field)
}

const getAllSettings = async (req, res, next) => {
  try {
    const { category } = req.query

    if (!['head_admin', 'admin', 'visitor', 'subcon'].includes(req.user.role)) {
      return next(createError(403, 'Access denied'))
    }

    const query = {}
    if (category) query.category = category

    const settings = await SystemSettings.find(query).sort({ category: 1, field: 1 })

    return res.status(200).json({ settings })
  } catch (error) {
    next(error)
  }
}

const addOptionValue = async (req, res, next) => {
  try {
    const { category, field, value } = req.body

    if (!['head_admin', 'admin'].includes(req.user.role)) {
      return next(createError(403, 'Access denied'))
    }

    if (!category || !field || !value) {
      return next(createError(400, 'Category, field, and value are required'))
    }

    const isContact = isContactPersonField(field)

    if (isContact) {
      const { name, contactNo } = value

      if (!name?.trim() || !contactNo?.trim()) {
        return next(createError(400, 'Contact person requires both name and contactNo'))
      }

      const trimmedName = name.trim()
      const trimmedContactNo = contactNo.trim()

      let setting = await SystemSettings.findOne({ category, field })

      if (!setting) {
        setting = await SystemSettings.create({
          category,
          field,
          contactPersonValues: [{ name: trimmedName, contactNo: trimmedContactNo }]
        })

        await ActivityLog.create({
          type: 'system_settings',
          performedBy: req.user._id,
          action: `Created new contact person field and added "${trimmedName}" to ${category} - ${field}`
        })

        return res.status(201).json({
          message: 'Setting field created and contact person added successfully',
          setting
        })
      }

      const nameExists = (setting.contactPersonValues || []).some(
        cp => cp.name.toLowerCase() === trimmedName.toLowerCase()
      )

      if (nameExists) {
        return res.status(400).json({ message: 'A contact person with this name already exists' })
      }

      setting.contactPersonValues.push({ name: trimmedName, contactNo: trimmedContactNo })
      await setting.save()

      await ActivityLog.create({
        type: 'system_settings',
        performedBy: req.user._id,
        action: `Added contact person "${trimmedName}" to ${category} - ${field}`
      })

      return res.status(200).json({ message: 'Contact person added successfully', setting })
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : ''

    if (!trimmedValue) {
      return next(createError(400, 'Value cannot be empty'))
    }

    let setting = await SystemSettings.findOne({ category, field })

    if (!setting) {
      setting = await SystemSettings.create({
        category,
        field,
        values: [trimmedValue]
      })

      await ActivityLog.create({
        type: 'system_settings',
        performedBy: req.user._id,
        action: `Created new setting field and added option "${trimmedValue}" to ${category} - ${field}`
      })

      return res.status(201).json({
        message: 'Setting field created and option added successfully',
        setting
      })
    }

    const valueExists = (setting.values || []).some(
      v => v.toLowerCase() === trimmedValue.toLowerCase()
    )

    if (valueExists) {
      return res.status(400).json({ message: 'This option already exists' })
    }

    setting.values.push(trimmedValue)
    await setting.save()

    await ActivityLog.create({
      type: 'system_settings',
      performedBy: req.user._id,
      action: `Added option "${trimmedValue}" to ${category} - ${field}`
    })

    return res.status(200).json({ message: 'Option added successfully', setting })
  } catch (error) {
    next(error)
  }
}

const removeOptionValue = async (req, res, next) => {
  try {
    const { category, field, value } = req.body

    if (!['head_admin', 'admin'].includes(req.user.role)) {
      return next(createError(403, 'Access denied'))
    }

    if (!category || !field || !value) {
      return next(createError(400, 'Category, field, and value are required'))
    }

    const setting = await SystemSettings.findOne({ category, field })

    if (!setting) {
      return next(createError(404, 'Setting field not found'))
    }

    const isContact = isContactPersonField(field)

    if (isContact) {
      const nameToRemove = typeof value === 'string' ? value.trim() : value

      const exists = (setting.contactPersonValues || []).some(cp => cp.name === nameToRemove)

      if (!exists) {
        return res.status(400).json({ message: 'Contact person does not exist' })
      }

      setting.contactPersonValues = setting.contactPersonValues.filter(
        cp => cp.name !== nameToRemove
      )
      await setting.save()

      await ActivityLog.create({
        type: 'system_settings',
        performedBy: req.user._id,
        action: `Removed contact person "${nameToRemove}" from ${category} - ${field}`
      })

      return res.status(200).json({ message: 'Contact person removed successfully', setting })
    }

    if (!(setting.values || []).includes(value)) {
      return res.status(400).json({ message: 'Option does not exist' })
    }

    setting.values = setting.values.filter(v => v !== value)
    await setting.save()

    await ActivityLog.create({
      type: 'system_settings',
      performedBy: req.user._id,
      action: `Removed option "${value}" from ${category} - ${field}`
    })

    return res.status(200).json({ message: 'Option deleted successfully', setting })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAllSettings, addOptionValue, removeOptionValue }