import { useId, useState } from 'react'

interface TableSearchToolbarProps {
  placeholder?: string
  onSearch: (query: string) => void
}

export default function TableSearchToolbar({ placeholder = 'Tabloda ara...', onSearch }: TableSearchToolbarProps) {
  const id = useId()
  const [query, setQuery] = useState('')

  function handleChange(value: string) {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="table-search-toolbar">
      <div className="input-group input-group-merge table-search-group">
        <span className="input-group-text">
          <i className="ti ti-search" />
        </span>
        <input
          type="search"
          id={id}
          className="form-control table-search-input"
          placeholder={placeholder}
          autoComplete="off"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  )
}
