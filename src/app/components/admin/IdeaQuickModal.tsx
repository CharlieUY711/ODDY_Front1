/**
 * IdeaQuickModal — Modal compacto de la lamparita 💡
 * Acceso rápido desde Mi Vista (Dashboard).
 * Área + texto libre · Recientes del área · Relacionar · Guardar
 */

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, ExternalLink, Link2, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API = `https://${projectId}.supabase.co/functions/v1/make-server-75638143/ideas`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };
const ORANGE = '#FF6835';

const AREAS = [
  'General', 'Logística', 'Pagos', 'Tiendas', 'Redes Sociales',
  'Servicios', 'eCommerce', 'Marketing', 'ERP', 'Sistema', 'Herramientas',
];

interface IdeaNote {
  id: string;
  area: string;
  text: string;
  timestamp: string;
  relatedIds: string[];
}

interface Props {
  onClose: () => void;
  onOpenBoard: () => void;
}

export function IdeaQuickModal({ onClose, onOpenBoard }: Props) {
  const [area, setArea] = useState('General');
  const [text, setText] = useState('');
  const [ideas, setIdeas] = useState<IdeaNote[]>([]);
  const [selectedRelated, setSelectedRelated] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cargar ideas cuando cambia el área
  useEffect(() => {
    setSelectedRelated([]);
    (async () => {
      try {
        const res = await fetch(`${API}/ideas?area=${encodeURIComponent(area)}`, { headers: HEADERS });
        const { ideas: list } = await res.json();
        setIdeas(list ?? []);
      } catch (err) {
        console.error('[IdeaQuickModal] Error cargando ideas:', err);
      }
    })();
  }, [area]);

  const toggleRelated = (id: string) => {
    setSelectedRelated(p =>
      p.includes(id) ? p.filter(r => r !== id) : [...p, id]
    );
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API}/ideas`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ area, text: text.trim(), relatedIds: selectedRelated }),
      });
      setSaved(true);
      setTimeout(() => {
        setText('');
        setSelectedRelated([]);
        setSaved(false);
        setSaving(false);
      }, 1200);
    } catch (err) {
      console.error('[IdeaQuickModal] Error guardando idea:', err);
      setSaving(false);
    }
  };

  const recent = ideas.slice(0, 5);

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '80px 24px 0 0',
        pointerEvents: 'none',
      }}
    >
      {/* Backdrop click to close */}
      <div
        style={{ position: 'fixed', inset: 0, pointerEvents: 'all' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1.5px solid #E5E7EB',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          width: 340,
          overflow: 'hidden',
          pointerEvents: 'all',
          animation: 'slideDown 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: ORANGE,
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={16} color="#fff" strokeWidth={2.5} />
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>
              Nueva Idea
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Abrir board completo */}
            <button
              onClick={onOpenBoard}
              title="Abrir Ideas Board completo"
              style={{
                background: 'rgba(255,255,255,0.22)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 7px',
                gap: 4,
                fontSize: '0.68rem',
                fontWeight: '700',
              }}
            >
              <ExternalLink size={12} /> Board
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.85)',
                display: 'flex',
                padding: 4,
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 16px' }}>
          {/* Área selector */}
          <div style={{ marginBottom: 11 }}>
            <label style={{
              fontSize: '0.68rem',
              fontWeight: '700',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 5,
            }}>
              Área
            </label>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1.5px solid #E5E7EB',
                borderRadius: 8,
                fontSize: '0.82rem',
                outline: 'none',
                color: '#111827',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer',
              }}
            >
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Texto */}
          <div style={{ marginBottom: 12 }}>
            <label style={{
              fontSize: '0.68rem',
              fontWeight: '700',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 5,
            }}>
              Idea
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="¿Qué se te ocurrió?"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1.5px solid ${text ? ORANGE + '99' : '#E5E7EB'}`,
                borderRadius: 8,
                fontSize: '0.82rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                color: '#111827',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
                backgroundColor: '#FAFAFA',
              }}
              onFocus={e => (e.target.style.borderColor = ORANGE)}
              onBlur={e => (e.target.style.borderColor = text ? ORANGE + '99' : '#E5E7EB')}
              autoFocus
            />
          </div>

          {/* Ideas recientes del área con opción de relacionar */}
          {recent.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <Link2 size={10} />
                Recientes en {area} — click para relacionar
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recent.map(idea => {
                  const related = selectedRelated.includes(idea.id);
                  return (
                    <button
                      key={idea.id}
                      onClick={() => toggleRelated(idea.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '6px 9px',
                        backgroundColor: related ? `${ORANGE}12` : '#F9FAFB',
                        border: `1px solid ${related ? ORANGE + '66' : '#E5E7EB'}`,
                        borderRadius: 7,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Checkbox visual */}
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        border: `2px solid ${related ? ORANGE : '#D1D5DB'}`,
                        backgroundColor: related ? ORANGE : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                        transition: 'all 0.12s',
                      }}>
                        {related && <Check size={9} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.72rem',
                          color: '#374151',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {idea.text}
                        </p>
                        <p style={{ margin: '1px 0 0', fontSize: '0.6rem', color: '#9CA3AF' }}>
                          {new Date(idea.timestamp).toLocaleString('es-UY', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                          {idea.relatedIds?.length > 0 && (
                            <span style={{ marginLeft: 6, color: ORANGE }}>
                              · {idea.relatedIds.length} relacionada{idea.relatedIds.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Relacionadas seleccionadas */}
          {selectedRelated.length > 0 && (
            <div style={{
              marginBottom: 10,
              padding: '5px 9px',
              backgroundColor: `${ORANGE}0D`,
              borderRadius: 7,
              fontSize: '0.7rem',
              color: ORANGE,
              fontWeight: '600',
            }}>
              <Link2 size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              {selectedRelated.length} idea{selectedRelated.length > 1 ? 's' : ''} relacionada{selectedRelated.length > 1 ? 's' : ''}
            </div>
          )}

          {/* Botón guardar */}
          <button
            disabled={!text.trim() || saving}
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: saved ? '#10B981' : (text.trim() ? ORANGE : '#E5E7EB'),
              color: text.trim() || saved ? '#fff' : '#9CA3AF',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: text.trim() && !saving ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {saved ? (
              <><Check size={15} strokeWidth={3} /> Guardada ✓</>
            ) : saving ? (
              'Guardando…'
            ) : (
              <><Lightbulb size={14} /> Guardar idea</>
            )}
          </button>
        </div>

        {/* CSS animation */}
        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
