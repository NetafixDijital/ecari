import { useEffect, useState } from 'react'
import { fetchModuleSettings } from '../api/cfg'

export function useWarehouseEnabled() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModuleSettings()
      .then((settings) => {
        const setting = settings.find(
          (s) => s.moduleCode === 'WHS' && s.settingKey === 'whs.use_warehouse',
        )
        setEnabled(setting?.settingValue === 'true')
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false))
  }, [])

  return { warehouseEnabled: enabled, loading }
}
