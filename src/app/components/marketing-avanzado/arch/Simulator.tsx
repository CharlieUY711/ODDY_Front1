import { useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend
} from 'recharts'

interface SimReward {
  id:     number
  name:   string
  weight: number
  color:  string
  type:   string
}

interface SimResult {
  name:      string
  color:     string
  teorico:   number
  simulado:  number
  hits:      number
  weight:    number
}

const PRESET_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
  '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#84CC16',
]

const PRESET_TYPES = ['percentage', 'credit', 'product', 'access', 'none (sin premio)']

const PRESETS = [
  {
    label: 'Clásica',
    desc: '1 premio premium, varios comunes, sin premio',
    rewards: [
      { id: 1, name: 'Descuento 30%', weight: 5,  color: PRESET_COLORS[0], type: 'percentage' },
      { id: 2, name: 'Crédito $200',  weight: 15, color: PRESET_COLORS[1], type: 'credit' },
      { id: 3, name: 'Crédito $50',   weight: 35, color: PRESET_COLORS[2], type: 'credit' },
      { id: 4, name: 'Descuento 5%',  weight: 30, color: PRESET_COLORS[3], type: 'percentage' },
      { id: 5, name: 'Sin premio',    weight: 15, color: '#484F58',         type: 'none (sin premio)' },
    ],
  },
  {
    label: 'Flash sale',
    desc: 'Todos ganan, premios balanceados',
    rewards: [
      { id: 1, name: 'Premio top',    weight: 10, color: PRESET_COLORS[0], type: 'product' },
      { id: 2, name: 'Crédito $150',  weight: 30, color: PRESET_COLORS[1], type: 'credit' },
      { id: 3, name: 'Acceso VIP',    weight: 20, color: PRESET_COLORS[2], type: 'access' },
      { id: 4, name: 'Descuento 10%', weight: 40, color: PRESET_COLORS[3], type: 'percentage' },
    ],
  },
  {
    label: 'Ultra raro',
    desc: 'Un premio casi imposible',
    rewards: [
      { id: 1, name: 'iPhone gratis', weight: 1,  color: PRESET_COLORS[0], type: 'product' },
      { id: 2, name: 'Crédito $500',  weight: 4,  color: PRESET_COLORS[1], type: 'credit' },
      { id: 3, name: 'Descuento 20%', weight: 20, color: PRESET_COLORS[2], type: 'percentage' },
      { id: 4, name: 'Descuento 5%',  weight: 75, color: PRESET_COLORS[3], type: 'percentage' },
    ],
  },
]

// Simulación con Math.random() — en producción es crypto.randomInt
function weightedRandom(rewards: SimReward[]): number {
  const total = rewards.reduce((s, r) => s + r.weight, 0)
  let roll = Math.random() * total
  for (let i = 0; i < rewards.length; i++) {
    roll -= rewards[i].weight
    if (roll <= 0) return i
  }
  return rewards.length - 1
}

function runSimulation(rewards: SimReward[], iterations: number): SimResult[] {
  const hits = new Array(rewards.length).fill(0)
  const total = rewards.reduce((s, r) => s + r.weight, 0)

  for (let i = 0; i < iterations; i++) {
    hits[weightedRandom(rewards)]++
  }

  return rewards.map((r, i) => ({
    name:     r.name.length > 14 ? r.name.slice(0, 13) + '…' : r.name,
    color:    r.color,
    teorico:  Math.round((r.weight / total) * 10000) / 100,
    simulado: Math.round((hits[i] / iterations) * 10000) / 100,
    hits:     hits[i],
    weight:   r.weight,
  }))
}

const ITERATIONS_OPTIONS = [
  { label: '1K',   value: 1_000 },
  { label: '10K',  value: 10_000 },
  { label: '100K', value: 100_000 },
  { label: '1M',   value: 1_000_000 },
]

let nextId = 10

export function Simulator() {
  const [rewards, setRewards]       = useState<SimReward[]>(PRESETS[0].rewards)
  const [iterations, setIterations] = useState(10_000)
  const [results, setResults]       = useState<SimResult[] | null>(null)
  const [running, setRunning]       = useState(false)

  const totalWeight = rewards.reduce((s, r) => s + r.weight, 0)

  const simulate = useCallback(() => {
    if (rewards.length === 0 || totalWeight === 0) return
    setRunning(true)
    // setTimeout para que el estado "running" se renderice antes del cálculo
    setTimeout(() => {
      const res = runSimulation(rewards, iterations)
      setResults(res)
      setRunning(false)
    }, 20)
  }, [rewards, iterations, totalWeight])

  const addReward = () => {
    const id = nextId++
    setRewards(prev => [...prev, {
      id,
      name:   `Premio ${id}`,
      weight: 10,
      color:  PRESET_COLORS[id % PRESET_COLORS.length],
      type:   'credit',
    }])
    setResults(null)
  }

  const removeReward = (id: number) => {
    setRewards(prev => prev.filter(r => r.id !== id))
    setResults(null)
  }

  const updateReward = (id: number, field: keyof SimReward, value: string | number) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    setResults(null)
  }

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setRewards(preset.rewards)
    setResults(null)
  }

  const maxDelta = results
    ? Math.max(...results.map(r => Math.abs(r.simulado - r.teorico)))
    : 0

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.16em', color: '#10B981', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
          ⚛ Simulador
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Simulador de probabilidades
        </h2>
        <p style={{ fontSize: 13, color: '#8B949E', lineHeight: 1.6 }}>
          Configurá premios con pesos relativos y simulá N activaciones.
          Compará la distribución <span style={{ color: '#6366F1' }}>teórica esperada</span> vs
          la <span style={{ color: '#10B981' }}>distribución real simulada</span>.
        </p>
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 8,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          fontSize: 11, color: '#FCD34D', fontFamily: 'monospace',
        }}>
          ⚠ Esta simulación usa Math.random(). En producción, el backend usa
          crypto.randomInt() de Node.js (criptográficamente seguro).
        </div>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: 16 }}>
        <Label>Presets de ejemplo</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => loadPreset(p)}
              style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
                background: '#161B22', border: '1px solid #30363D', color: '#8B949E',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.color = '#A5B4FC'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#30363D'
                e.currentTarget.style.color = '#8B949E'
              }}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: config */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Label>Premios ({rewards.length})</Label>
            <button
              onClick={addReward}
              style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#A5B4FC', fontWeight: 600,
              }}
            >+ Agregar</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rewards.map(r => {
              const pct = totalWeight > 0 ? ((r.weight / totalWeight) * 100).toFixed(1) : '0'
              return (
                <div key={r.id} style={{
                  background: '#161B22', border: '1px solid #21262D',
                  borderRadius: 8, padding: '8px 10px',
                  borderLeft: `3px solid ${r.color}`,
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <input
                      value={r.name}
                      onChange={e => updateReward(r.id, 'name', e.target.value)}
                      style={{
                        flex: 1, background: '#0D1117', border: '1px solid #30363D',
                        borderRadius: 5, padding: '4px 7px', fontSize: 11, color: '#E6EDF3',
                        fontFamily: 'monospace', outline: 'none',
                      }}
                    />
                    <select
                      value={r.type}
                      onChange={e => updateReward(r.id, 'type', e.target.value)}
                      style={{
                        background: '#0D1117', border: '1px solid #30363D',
                        borderRadius: 5, padding: '4px 5px', fontSize: 9, color: '#8B949E',
                        outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {PRESET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {rewards.length > 2 && (
                      <button
                        onClick={() => removeReward(r.id)}
                        style={{
                          background: 'none', border: 'none', color: '#484F58',
                          cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px',
                          flexShrink: 0,
                        }}
                      >×</button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', flexShrink: 0 }}>
                      peso
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={r.weight}
                      onChange={e => updateReward(r.id, 'weight', parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: r.color, cursor: 'pointer' }}
                    />
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={r.weight}
                      onChange={e => updateReward(r.id, 'weight', Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: 46, background: '#0D1117', border: '1px solid #30363D',
                        borderRadius: 5, padding: '3px 5px', fontSize: 11, color: '#E6EDF3',
                        fontFamily: 'monospace', textAlign: 'right', outline: 'none',
                      }}
                    />
                    <span style={{
                      fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                      color: r.color, minWidth: 40, textAlign: 'right',
                    }}>
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total weight */}
          <div style={{
            marginTop: 10, padding: '6px 10px', borderRadius: 6,
            background: '#0D1117', border: '1px solid #21262D',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace' }}>
              peso total
            </span>
            <span style={{ fontSize: 12, color: '#8B949E', fontFamily: 'monospace', fontWeight: 700 }}>
              {totalWeight}
            </span>
          </div>

          {/* Iterations */}
          <div style={{ marginTop: 14 }}>
            <Label>Iteraciones</Label>
            <div style={{ display: 'flex', gap: 5 }}>
              {ITERATIONS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setIterations(opt.value); setResults(null) }}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 7, cursor: 'pointer',
                    fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                    background: iterations === opt.value ? 'rgba(99,102,241,0.18)' : '#161B22',
                    border: `1px solid ${iterations === opt.value ? 'rgba(99,102,241,0.5)' : '#30363D'}`,
                    color: iterations === opt.value ? '#A5B4FC' : '#8B949E',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={simulate}
            disabled={running || rewards.length === 0}
            style={{
              width: '100%', marginTop: 14, padding: '12px',
              borderRadius: 10, cursor: running ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
              background: running
                ? '#21262D'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none', color: running ? '#484F58' : '#fff',
              transition: 'all 0.2s', letterSpacing: '0.04em',
              boxShadow: running ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            {running
              ? `⟳ simulando ${iterations.toLocaleString()} activaciones…`
              : `▶ Simular ${iterations.toLocaleString()} activaciones`}
          </button>
        </div>

        {/* Right: results */}
        <div>
          {!results && (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: '#0D1117', border: '1px dashed #21262D',
              borderRadius: 12, padding: 24, gap: 10,
            }}>
              <div style={{ fontSize: 32, opacity: 0.2 }}>⟳</div>
              <div style={{ fontSize: 12, color: '#484F58', textAlign: 'center', lineHeight: 1.6 }}>
                Configurá los premios y sus pesos,<br />luego ejecutá la simulación.
              </div>
            </div>
          )}

          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Chart */}
              <div>
                <Label>Teórico vs Simulado (%)</Label>
                <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 10, padding: '12px 4px 8px' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={results} barGap={3} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9, fill: '#484F58', fontFamily: 'monospace' }}
                        tickLine={false} axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#484F58', fontFamily: 'monospace' }}
                        tickLine={false} axisLine={false}
                        tickFormatter={v => `${v}%`}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#161B22', border: '1px solid #30363D',
                          borderRadius: 8, fontSize: 11, fontFamily: 'monospace',
                        }}
                        labelStyle={{ color: '#E6EDF3', marginBottom: 4 }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(2)}%`,
                          name === 'teorico' ? 'Esperado' : 'Simulado',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', color: '#8B949E' }}
                        formatter={(v) => v === 'teorico' ? 'Esperado' : 'Simulado'}
                      />
                      <Bar dataKey="teorico" name="teorico" radius={[4, 4, 0, 0]}>
                        {results.map((r, i) => (
                          <Cell key={i} fill={r.color} fillOpacity={0.5} />
                        ))}
                      </Bar>
                      <Bar dataKey="simulado" name="simulado" radius={[4, 4, 0, 0]}>
                        {results.map((r, i) => (
                          <Cell key={i} fill={r.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Delta chart */}
              <div>
                <Label>Desviación (simulado − esperado)</Label>
                <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 10, padding: '12px 4px 8px' }}>
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={results.map(r => ({ ...r, delta: parseFloat((r.simulado - r.teorico).toFixed(2)) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#484F58', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#484F58', fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} width={40} />
                      <ReferenceLine y={0} stroke="#30363D" strokeWidth={1.5} />
                      <Tooltip
                        contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                        formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Δ desviación']}
                      />
                      <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                        {results.map((r, i) => {
                          const delta = r.simulado - r.teorico
                          return <Cell key={i} fill={delta >= 0 ? '#10B981' : '#EF4444'} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Results table */}
              <div style={{ background: '#0D1117', border: '1px solid #21262D', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 55px 55px', padding: '6px 10px', borderBottom: '1px solid #21262D' }}>
                  {['Premio', 'Peso', 'Hits', 'Esp.%', 'Real%'].map(h => (
                    <span key={h} style={{ fontSize: 9, color: '#484F58', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                  ))}
                </div>
                {results.map((r, i) => {
                  const delta = r.simulado - r.teorico
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 60px 60px 55px 55px',
                      padding: '6px 10px', borderBottom: '1px solid #161B22',
                      alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: '#E6EDF3', fontFamily: 'monospace' }}>{r.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#484F58', fontFamily: 'monospace' }}>{r.weight}</span>
                      <span style={{ fontSize: 10, color: '#8B949E', fontFamily: 'monospace' }}>{r.hits.toLocaleString()}</span>
                      <span style={{ fontSize: 10, color: '#6366F1', fontFamily: 'monospace' }}>{r.teorico.toFixed(2)}%</span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: Math.abs(delta) < 1 ? '#10B981' : Math.abs(delta) < 2 ? '#F59E0B' : '#EF4444' }}>
                        {r.simulado.toFixed(2)}%
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: maxDelta < 1 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${maxDelta < 1 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                fontSize: 11, color: '#8B949E', lineHeight: 1.6,
              }}>
                <span style={{ color: maxDelta < 1 ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                  {maxDelta < 1 ? '✓ Distribución correcta' : '~ Convergiendo'}
                </span>
                {' '}· desviación máxima: <strong style={{ color: '#E6EDF3' }}>{maxDelta.toFixed(2)}%</strong>
                {' '}· {iterations.toLocaleString()} activaciones simuladas.
                {iterations < 10_000 && (
                  <span style={{ color: '#484F58' }}> Probá con más iteraciones para mayor precisión.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#484F58', marginBottom: 6, fontFamily: 'monospace',
    }}>
      {children}
    </div>
  )
}
