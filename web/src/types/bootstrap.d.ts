export {}

declare global {
  interface Window {
    bootstrap?: {
      Modal: {
        getOrCreateInstance: (el: Element) => { show: () => void; hide: () => void }
      }
    }
  }
}
