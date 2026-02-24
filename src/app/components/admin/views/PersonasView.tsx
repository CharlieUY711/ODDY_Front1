/* =====================================================
   PersonasView — Base de Personas (natural / jurídica)
   ===================================================== */
import React, { useState, useEffect, useCallback } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { supabase } from '../../../../utils/supabase/client';
import { toast } from 'sonner';
import {
  Search, Plus, Edit2, Trash2, User, Building2,
  Mail, Phone, FileText, RefreshCw, X, Save, Filter,
  ChevronDown, MapPin, Globe, CheckCircle, XCircle,
} from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const ORANGE = '#FF6835';
const TIPOS = ['', 'natural', 'juridica'];
const GENEROS = ['', 'masculino', 'femenino', 'otro', 'prefiero no decir'];
const DOC_TIPOS = ['CI', 'RUT', 'Pasaporte', 'DNI', 'Otro'];

interface Persona {
  id: string;
  tipo: 'natural' | 'juridica';
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  documento_tipo?: string;
  documento_numero?: string;
  fecha_nacimiento?: string;
  genero?: string;
  nacionalidad?: string;
  direccion?: Record<string, string>;
  metadata?: Record<string, unknown>;
  activo: boolean;
  created_at: string;
}

const EMPTY: Omit<Persona, 'id' | 'created_at'> = {
  tipo: 'natural',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  documento_tipo: 'CI',
  documento_numero: '',
  fecha_nacimiento: '',
  genero: '',
  nacionalidad: '',
  direccion: { calle: '', ciudad: '', pais: '' },
  activo: true,
};

export function PersonasView({ onNavigate }: Props) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('personas_75638143')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterTipo) {
        query = query.eq('tipo', filterTipo);
      }

      if (filterActivo !== '') {
        query = query.eq('activo', filterActivo === 'true');
      }

      if (search) {
        query = query.or(
          `nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setPersonas(data ?? []);
    } catch (e: unknown) {
      console.error('Error cargando personas:', e);
      toast.error('Error al cargar personas');
    } finally {
      setLoading(false);
    }
  }, [search, filterTipo, filterActivo]);

  useEffect(() => { fetchPersonas(); }, [fetchPersonas]);

  const openCreate = () => {
    setEditando(null);
    setForm({ ...EMPTY });
    setShowModal(true);
  };

  const openEdit = (p: Persona) => {
    setEditando(p);
    setForm({
      tipo: p.tipo,
      nombre: p.nombre,
      apellido: p.apellido ?? '',
      email: p.email ?? '',
      telefono: p.telefono ?? '',
      documento_tipo: p.documento_tipo ?? 'CI',
      documento_numero: p.documento_numero ?? '',
      fecha_nacimiento: p.fecha_nacimiento?.split('T')[0] ?? '',
      genero: p.genero ?? '',
      nacionalidad: p.nacionalidad ?? '',
      direccion: p.direccion ?? { calle: '', ciudad: '', pais: '' },
      activo: p.activo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      if (!body.fecha_nacimiento || body.fecha_nacimiento === '') {
        delete body.fecha_nacimiento;
      }

      if (editando) {
        const { data, error } = await supabase
          .from('personas_75638143')
          .update(body)
          .eq('id', editando.id)
          .select()
          .single();

        if (error) throw error;
        toast.success('Persona actualizada');
      } else {
        const { data, error } = await supabase
          .from('personas_75638143')
          .insert(body)
          .select()
          .single();

        if (error) throw error;
        toast.success('Persona creada');
      }

      setShowModal(false);
      fetchPersonas();
    } catch (e: unknown) {
      console.error('Error guardando persona:', e);
      toast.error(`Error al guardar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta persona? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('personas_75638143')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Persona eliminada');
      fetchPersonas();
    } catch (e: unknown) {
      console.error('Error eliminando persona:', e);
      toast.error('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const setDir = (key: string, val: string) =>
    setForm(f => ({ ...f, direccion: { ...(f.direccion ?? {}), [key]: val } }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <OrangeHeader
        icon={User}
        title="Base de Personas"
        subtitle="Personas naturales y jurídicas del sistema"
        actions={[{ label: '+ Nueva Persona', primary: true, onClick: openCreate }]}
      />

      {/* ── Filtros ── */}
      <div style={{ padding: '16px 28px', backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellido o email..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          style={{ height: 36, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0 10px', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">Todos los tipos</option>
          <option value="natural">Natural</option>
          <option value="juridica">Jurídica</option>
        </select>
        <select
          value={filterActivo}
          onChange={e => setFilterActivo(e.target.value)}
          style={{ height: 36, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0 10px', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button onClick={fetchPersonas} style={{ height: 36, width: 36, border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={15} color="#6B7280" />
        </button>
      </div>

      {/* ── Tabla ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#9CA3AF' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Cargando personas...
          </div>
        ) : personas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            <User size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No hay personas registradas</p>
            <p style={{ fontSize: '0.875rem', marginTop: 4 }}>Creá la primera usando el botón "+ Nueva Persona"</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['Persona', 'Tipo', 'Documento', 'Contacto', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {personas.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < personas.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#FAFAFA'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: p.tipo === 'natural' ? '#EFF6FF' : '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.tipo === 'natural' ? <User size={16} color="#3B82F6" /> : <Building2 size={16} color={ORANGE} />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{p.nombre} {p.apellido ?? ''}</p>
                          {p.email && <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280' }}>{p.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, backgroundColor: p.tipo === 'natural' ? '#EFF6FF' : '#FFF7ED', color: p.tipo === 'natural' ? '#3B82F6' : ORANGE }}>
                        {p.tipo === 'natural' ? 'Natural' : 'Jurídica'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      {p.documento_tipo && p.documento_numero ? `${p.documento_tipo}: ${p.documento_numero}` : <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {p.email && <span style={{ color: '#6B7280', fontSize: '0.8rem' }}><Mail size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{p.email}</span>}
                        {p.telefono && <span style={{ color: '#6B7280', fontSize: '0.8rem' }}><Phone size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{p.telefono}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.activo
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}><CheckCircle size={14} />Activo</span>
                        : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontSize: '0.8rem', fontWeight: 600 }}><XCircle size={14} />Inactivo</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#374151' }}>
                          <Edit2 size={13} /> Editar
                        </button>
                        <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #FEE2E2', background: '#FFF5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#EF4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            {/* Header modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                {editando ? 'Editar Persona' : 'Nueva Persona'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>

            {/* Body modal */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tipo */}
              <div>
                <label style={labelStyle}>Tipo *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['natural', 'juridica'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, border: `2px solid ${form.tipo === t ? ORANGE : '#E5E7EB'}`, background: form.tipo === t ? '#FFF7ED' : '#fff', cursor: 'pointer', fontWeight: 600, color: form.tipo === t ? ORANGE : '#6B7280', fontSize: '0.875rem' }}>
                      {t === 'natural' ? '👤 Persona Natural' : '🏢 Persona Jurídica'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre / Apellido */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>{form.tipo === 'natural' ? 'Nombre *' : 'Razón Social *'}</label>
                  <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} placeholder={form.tipo === 'natural' ? 'Ej: María' : 'Ej: TechSur SA'} />
                </div>
                {form.tipo === 'natural' && (
                  <div>
                    <label style={labelStyle}>Apellido</label>
                    <input value={form.apellido ?? ''} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} style={inputStyle} placeholder="Ej: García" />
                  </div>
                )}
              </div>

              {/* Email / Teléfono */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input value={form.telefono ?? ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} style={inputStyle} placeholder="+598 99 123 456" />
                </div>
              </div>

              {/* Documento */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Tipo Doc.</label>
                  <select value={form.documento_tipo ?? 'CI'} onChange={e => setForm(f => ({ ...f, documento_tipo: e.target.value }))} style={selectStyle}>
                    {DOC_TIPOS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nro. Documento</label>
                  <input value={form.documento_numero ?? ''} onChange={e => setForm(f => ({ ...f, documento_numero: e.target.value }))} style={inputStyle} placeholder="Ej: 1.234.567-8" />
                </div>
              </div>

              {/* Solo para natural */}
              {form.tipo === 'natural' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Fecha de Nacimiento</label>
                    <input type="date" value={form.fecha_nacimiento ?? ''} onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Género</label>
                    <select value={form.genero ?? ''} onChange={e => setForm(f => ({ ...f, genero: e.target.value }))} style={selectStyle}>
                      <option value="">Sin especificar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                      <option value="prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Nacionalidad */}
              <div>
                <label style={labelStyle}>Nacionalidad</label>
                <input value={form.nacionalidad ?? ''} onChange={e => setForm(f => ({ ...f, nacionalidad: e.target.value }))} style={inputStyle} placeholder="Ej: Uruguaya" />
              </div>

              {/* Dirección */}
              <div>
                <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>Dirección</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input value={form.direccion?.calle ?? ''} onChange={e => setDir('calle', e.target.value)} style={inputStyle} placeholder="Calle y número" />
                  <input value={form.direccion?.ciudad ?? ''} onChange={e => setDir('ciudad', e.target.value)} style={inputStyle} placeholder="Ciudad" />
                  <input value={form.direccion?.pais ?? ''} onChange={e => setDir('pais', e.target.value)} style={inputStyle} placeholder="País" />
                  <input value={form.direccion?.cp ?? ''} onChange={e => setDir('cp', e.target.value)} style={inputStyle} placeholder="Código postal" />
                </div>
              </div>

              {/* Activo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: ORANGE }} />
                <label htmlFor="activo" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>Persona activa en el sistema</label>
              </div>
            </div>

            {/* Footer modal */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', backgroundColor: ORANGE, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                <Save size={15} /> {saving ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear persona')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, border: '1.5px solid #E5E7EB', borderRadius: 8,
  padding: '0 12px', fontSize: '0.875rem', color: '#111827', outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = {
  width: '100%', height: 38, border: '1.5px solid #E5E7EB', borderRadius: 8,
  padding: '0 10px', fontSize: '0.875rem', color: '#374151', cursor: 'pointer', outline: 'none',
};