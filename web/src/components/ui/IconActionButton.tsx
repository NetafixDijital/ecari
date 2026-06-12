export default function IconActionButton({
  icon,
  color,
  title,
  onClick,
  disabled,
}: {
  icon: string
  color: string
  title: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`btn btn-sm btn-icon btn-label-${color} rounded-pill`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`ti ${icon}`} />
    </button>
  )
}
