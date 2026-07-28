export function parseCSV(text: string, delimiter: string = ';'): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === delimiter) {
        row.push(field)
        field = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') {
          i++
        }
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else {
        field += c
      }
    }
  }
  if (row.length > 0 || field !== '') {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function tryDecode(encoding: string, buffer: Buffer): string | null {
  try {
    const dec = new TextDecoder(encoding, { fatal: true })
    return dec.decode(buffer)
  } catch (e) {
    return null
  }
}

export function decodeBuffer(buffer: Buffer): string {
  // Try UTF-8 first
  const utf8 = tryDecode('utf-8', buffer)
  if (utf8) {
    const replacementCount = (utf8.match(/\uFFFD/g) || []).length
    if (replacementCount === 0) return utf8
  }
  // Fallback to Windows-1252
  const latin1 = tryDecode('windows-1252', buffer)
  return latin1 || utf8 || buffer.toString('utf-8')
}
