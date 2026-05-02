import { createContext, useContext, useEffect, useState } from 'react'
import useGetSettings from '../hooks/useGetSettings'
import useAddOptionValue from '../hooks/useAddOptionValue'
import useRemoveOptionValue from '../hooks/useRemoveOptionValue'
import { toast } from 'react-toastify'

const SettingsContext = createContext()

const CONTACT_FIELDS = ['fieldContactPersons', 'receivingContactPersons']

function isContactField (field) {
  return CONTACT_FIELDS.includes(field)
}

function extractFieldValues (setting) {
  return isContactField(setting.field)
    ? setting.contactPersonValues || []
    : setting.values || []
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    trucksDrivers: {
      truckType: [],
      status: [],
      subcon: []
    },
    deployments: {
      hybrid: [],
      territory: [],
      flagging: [],
      destination: [],
      pickupSite: [],
      municipality: [],
      fieldContactPersons: [],
      receivingContactPersons: []
    }
  })

  const { getSettingsFunction, isLoading: isLoadingSettings } = useGetSettings()
  const { addOptionValueFunction, isLoading: isAdding } = useAddOptionValue()
  const { removeOptionValueFunction, isLoading: isRemoving } = useRemoveOptionValue()

  const fetchSettings = async () => {
    const result = await getSettingsFunction()

    if (result.settings) {
      const trucksDrivers = {
        truckType: [],
        status: [],
        subcon: []
      }
      const deployments = {
        hybrid: [],
        territory: [],
        flagging: [],
        destination: [],
        pickupSite: [],
        municipality: [],
        fieldContactPersons: [],
        receivingContactPersons: []
      }

      result.settings.forEach(setting => {
        if (setting.category === 'trucksDrivers') {
          trucksDrivers[setting.field] = extractFieldValues(setting)
        } else if (setting.category === 'deployments') {
          deployments[setting.field] = extractFieldValues(setting)
        }
      })

      setSettings({ trucksDrivers, deployments })
    }
  }

  const addOption = async ({ category, field, value }) => {
    const result = await addOptionValueFunction({ category, field, value })

    if (result.setting) {
      toast.success(result.message)

      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: extractFieldValues(result.setting)
        }
      }))

      return true
    } else {
      toast.error(result)
      return false
    }
  }

  const removeOption = async ({ category, field, value }) => {
    const result = await removeOptionValueFunction({ category, field, value })

    if (result.setting) {
      toast.success(result.message)

      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: extractFieldValues(result.setting)
        }
      }))

      return true
    } else {
      toast.error(result)
      return false
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoadingSettings,
        isAdding,
        isRemoving,
        fetchSettings,
        addOption,
        removeOption
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettingsContext = () => useContext(SettingsContext)