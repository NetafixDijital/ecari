export function normalizeTaxId(value: string) {
  return value.replace(/\D/g, '')
}

/** Algoritma doğrulaması yok — yalnızca dolu olup olmadığı kontrol edilir. */
export function hasTaxId(value: string) {
  return normalizeTaxId(value).length > 0
}
