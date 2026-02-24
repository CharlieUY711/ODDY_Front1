import { useState } from 'react'

interface CodeBlockProps {
  code: string
  title?: string
  badge?: string
  badgeColor?: string
}

export function CodeBlock({ code, title, badge, badgeColor = '#6366F1' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #30363D', margin: '12px 0' }}>
      {(title || badge) && (
        <div style={{
          background: '#161B22', padding: '7px 14px',
          borderBottom: '1px solid #30363D',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: badgeColor + '22', color: badgeColor,
                border: `1px solid ${badgeColor}44`,
                padding: '2px 7px', borderRadius: 20, fontFamily: 'monospace'
              }}>{badge}</span>
            )}
            {title && (
              <span style={{ fontSize: 11, color: '#8B949E', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                {title}
              </span>
            )}
          </div>
          <button
            onClick={copy}
            style={{
              fontSize: 10, color: copied ? '#10B981' : '#484F58',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.15s', padding: '2px 6px', fontFamily: 'monospace'
            }}
          >
            {copied ? '✓ copiado' : 'copiar'}
          </button>
        </div>
      )}
      <pre style={{
        background: '#0D1117', padding: '16px 18px',
        overflow: 'auto', margin: 0,
        fontSize: 12, lineHeight: 1.75,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        color: '#E6EDF3', tabSize: 2
      }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
