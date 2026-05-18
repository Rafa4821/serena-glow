function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(s) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/~~(.+?)~~/g,     '<s>$1</s>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

export function parseMarkdown(text) {
  if (!text) return ''
  const lines  = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]

    if (/^#### /.test(raw))        { blocks.push(`<h4>${inline(raw.slice(5))}</h4>`); i++; continue }
    if (/^### /.test(raw))         { blocks.push(`<h3>${inline(raw.slice(4))}</h3>`); i++; continue }
    if (/^## /.test(raw))          { blocks.push(`<h2>${inline(raw.slice(3))}</h2>`); i++; continue }
    if (/^# /.test(raw))           { blocks.push(`<h1>${inline(raw.slice(2))}</h1>`); i++; continue }
    if (/^---+$/.test(raw.trim())) { blocks.push('<hr />');                            i++; continue }
    if (/^> /.test(raw))           { blocks.push(`<blockquote><p>${inline(raw.slice(2))}</p></blockquote>`); i++; continue }

    if (/^[-*] /.test(raw)) {
      const items = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`)
        i++
      }
      blocks.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\d+\. /.test(raw)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`)
        i++
      }
      blocks.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    if (raw.trim() === '') { i++; continue }

    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[#>]/.test(lines[i]) &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(inline(lines[i]))
      i++
    }
    if (paraLines.length) blocks.push(`<p>${paraLines.join('<br />')}</p>`)
  }

  return blocks.join('\n')
}

export function calcReadTime(content) {
  if (!content) return 1
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
