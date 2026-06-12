import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { StkItemListItem } from '../../api/stk'
import { formatMoneyOptional, formatQuantity } from '../../utils/format'

type StokLineSearchProps = {
  items: StkItemListItem[]
  selectedId: number | ''
  priceMode: 'sales' | 'purchase'
  onSelect: (item: StkItemListItem) => void
  onClear: () => void
  disabled?: boolean
}

function itemPrice(item: StkItemListItem, priceMode: 'sales' | 'purchase') {
  return priceMode === 'purchase' ? item.purchasePrice : item.salesPrice
}

export default function StokLineSearch({
  items,
  selectedId,
  priceMode,
  onSelect,
  onClear,
  disabled,
}: StokLineSearchProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 })

  const selected = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) : undefined),
    [items, selectedId],
  )

  useEffect(() => {
    if (selected) setQuery(`${selected.code} — ${selected.name}`)
  }, [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 15)
    return items
      .filter((item) =>
        [item.code, item.name, item.barcode, item.brandName, item.baseUnitName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 15)
  }, [items, query])

  const updateMenuPosition = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updateMenuPosition()
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [open, query, updateMenuPosition])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        wrapRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    setOpen(true)
    if (selected && value !== `${selected.code} — ${selected.name}`) {
      onClear()
    }
  }

  function handlePick(item: StkItemListItem) {
    setQuery(`${item.code} — ${item.name}`)
    setOpen(false)
    onSelect(item)
  }

  const dropdown =
    open && !disabled
      ? createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu show shadow-sm p-0 border"
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              maxHeight: '14rem',
              overflowY: 'auto',
              zIndex: 1080,
            }}
          >
            {filtered.length === 0 ? (
              <div className="dropdown-item-text text-body-secondary small px-3 py-2">
                Sonuç bulunamadı
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="dropdown-item py-2"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(item)}
                >
                  <div className="d-flex justify-content-between gap-2 align-items-start">
                    <div className="text-start">
                      <span className="font-mono small text-primary">{item.code}</span>
                      <div className="small">{item.name}</div>
                    </div>
                    <div className="text-end small text-nowrap text-body-secondary">
                      <div>{formatMoneyOptional(itemPrice(item, priceMode))}</div>
                      <div>Stok: {formatQuantity(item.stockQuantity)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div ref={wrapRef} className="position-relative" style={{ minWidth: '12rem' }}>
        <i
          className="ti ti-search position-absolute text-body-secondary"
          style={{
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.85rem',
            pointerEvents: 'none',
            zIndex: 1,
          }}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          className="form-control form-control-sm"
          placeholder="Stok ara..."
          value={query}
          disabled={disabled}
          style={{ paddingLeft: '1.75rem' }}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setOpen(true)
            updateMenuPosition()
          }}
          autoComplete="off"
        />
      </div>
      {dropdown}
    </>
  )
}
