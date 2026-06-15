export default function FullscreenIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" aria-hidden="true">
      <path
        d="M2 12.5C2 8.72876 2 6.84315 3.17157 5.67157C4.34315 4.5 6.22876 4.5 10 4.5H14C17.7712 4.5 19.6569 4.5 20.8284 5.67157C22 6.84315 22 8.72876 22 12.5V14.5C22 18.2712 22 20.1569 20.8284 21.3284C19.6569 22.5 17.7712 22.5 14 22.5H10C6.22876 22.5 4.34315 22.5 3.17157 21.3284C2 20.1569 2 18.2712 2 14.5V12.5Z"
        stroke={active ? 'var(--bs-primary)' : 'var(--bs-heading-color)'}
        strokeWidth="2"
      />
    </svg>
  )
}
