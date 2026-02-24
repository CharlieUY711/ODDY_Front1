/* =====================================================
   ClientesView — Personas y Organizaciones con rol 'cliente'
   ===================================================== */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OrangeHeader } from '../OrangeHeader';
import type { MainSection } from '../../../AdminDashboard';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import {
  Search, User, Building2, Mail, Phone, RefreshCw,
  Plus, X, Save, CheckCircle, XCircle, Tag, Users,
  ShoppingBag, Calendar, ChevronRight,
} from 'lucide-react';

interface Props { onNavigate: (section: MainSection) => void; }

const API = `https://${projectId}.supabase.co/functions/v1/make-server-75638143`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };
const ORANGE = '#FF6835';

interface RolCliente {
  id: string;
  persona_id?: string;
  organizacion_id?: string;
  rol: string;
  contexto?: string;
  activo: boolean;
  created_at: string;
  persona?: {
    id: string;
    nombre: string;
    apellido?: string;
    email?: string;
    tipo: string;
    telefono?: string;
  };
  organizacion?: {
    id: string;
    nombre: string;
    tipo?: string;
  };
}

interface OrgCliente {
  id: string;
  nombre: string;
  tipo?: string;
  roles: RolCliente[];
}

interface PersonaOption { id: string; nombre: string; apellido?: string; email?: string; }
interface OrgOption     { id: string; nombre: string; }

type Tab = 'personas' | 'organizaciones';

export function ClientesView({ onNavigate }: Props) {
  const [allRoles, setAllRoles]     = useState<RolCliente[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<Tab>('personas');
  const [search, setSearch]         = useState('');
  const [filterActivo, setFilterActivo] = useState('true');

  // Modal
  const [showModal, setShowModal]   = useState(false);
  const [personas, setPersonas]     = useState<PersonaOption[]>([]);
  const [orgs, setOrgs]             = useState<OrgOption[]>([]);
  const [form, setForm]             = useState({ persona_id: '', organizacion_id: '', contexto: '', activo: true });
  const [saving, setSaving]         = useState(false);

  /* ── Fetch todos los roles cliente ── */
  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ rol: 'cliente' });
      if (filterActivo !== '') params.set('activo', filterActivo);
      const res  = await fetch(`${API}/roles?${params}`, { headers: HEADERS });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAllRoles(json.data ?? []);
    } catch (e: unknown) {
      console.error('Error cargando clientes:', e);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [filterActivo]);

  const fetchOptions = useCallback(async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch(`${API}/personas?activo=true`, { headers: HEADERS }),
        fetch(`${API}/organizaciones?activo=true`, { headers: HEADERS }),
      ]);
      const [pJson, oJson] = await Promise.all([pRes.json(), oRes.json()]);
      setPersonas(pJson.data ?? []);
      setOrgs(oJson.data ?? []);
    } catch (e) { console.error('Error cargando opciones:', e); }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  /* ── Derived lists ── */
  const personasClientes: RolCliente[] = useMemo(() =>
    allRoles.filter(r => r.persona_id), [allRoles]);

  const orgsClientes: OrgCliente[] = useMemo(() => {
    const map = new Map<string, OrgCliente>();
    allRoles.forEach(r => {
      if (!r.organizacion_id || !r.organizacion) return;
      if (!map.has(r.organizacion_id)) {
        map.set(r.organizacion_id, { id: r.organizacion_id, nombre: r.organizacion.nombre, tipo: r.organizacion.tipo, roles: [] });
      }
      map.get(r.organizacion_id)!.roles.push(r);
    });
    return Array.from(map.values());
  }, [allRoles]);

  /* ── Search filter ── */
  const filteredPersonas = useMemo(() => personasClientes.filter(c => {
    if (!search) return true;
    const full  = `${c.persona?.nombre ?? ''} ${c.persona?.apellido ?? ''}`.toLowerCase();
    const email = (c.persona?.email ?? '').toLowerCase();
    const org   = (c.organizacion?.nombre ?? '').toLowerCase();
    const s     = search.toLowerCase();
    return full.includes(s) || email.includes(s) || org.includes(s);
  }), [personasClientes, search]);

  const filteredOrgs = useMemo(() => orgsClientes.filter(o => {
    if (!search) return true;
    return o.nombre.toLowerCase().includes(search.toLowerCase()) || (o.tipo ?? '').toLowerCase().includes(search.toLowerCase());
  }), [orgsClientes, search]);

  /* ── Stats ── */
  const totalActivos   = allRoles.filter(r => r.activo).length;
  const totalInactivos = allRoles.filter(r => !r.activo).length;

  /* ── Save ── */
  const openModal = () => {
    fetchOptions();
    setForm({ persona_id: '', organizacion_id: '', contexto: '', activo: true });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.persona_id && !form.organizacion_id) {
      toast.error('Seleccioná al menos una persona u organización');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        rol: 'cliente',
        persona_id: form.persona_id || null,
        organizacion_id: form.organizacion_id || null,
      };
      const res  = await fetch(`${API}/roles`, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success('Cliente registrado correctamente');
      setShowModal(false);
      fetchClientes();
    } catch (e: unknown) {
      console.error('Error creando cliente:', e);
      toast.error(`Error: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (r: RolCliente) => {
    try {
      const res  = await fetch(`${API}/roles/${r.id}`, {
        method: 'PUT', headers: HEADERS,
        body: JSON.stringify({ activo: !r.activo }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success(r.activo ? 'Cliente desactivado' : 'Cliente activado');
      fetchClientes();
    } catch (e: unknown) {
      console.error('Error actualizando cliente:', e);
      toast.error('Error al actualizar');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <OrangeHeader
        icon={ShoppingBag}
        title="Clientes"
        subtitle="Personas y organizaciones con rol de cliente en el sistema"
        actions={[{ label: '+ Registrar Cliente', primary: true, onClick: openModal }]}
      />

      {/* ── Stats ── */}
      <div style={{ padding: '14px 28px', backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Registros', value: allRoles.length,          icon: Tag,        color: ORANGE      },
          { label: 'Personas Clientes', value: personasClientes.length, icon: User,       color: '#3B82F6'   },
          { label: 'Orgs. Clientes',    value: orgsClientes.length,     icon: Building2,  color: '#8B5CF6'   },
          { label: 'Activos',           value: totalActivos,            icon: CheckCircle, color: '#10B981'  },
          { label: 'Inactivos',         value: totalInactivos,          icon: XCircle,     color: '#EF4444'  },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', backgroundColor: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B7280' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 28px', display: 'flex', gap: 0 }}>
        {([
          { key: 'personas',       label: 'Personas Clientes',       icon: User,      count: personasClientes.length },
          { key: 'organizaciones', label: 'Organizaciones Clientes', icon: Building2, count: orgsClientes.length     },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '12px 18px',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? `3px solid ${ORANGE}` : '3px solid transparent',
              color: tab === t.key ? ORANGE : '#6B7280',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: '0.875rem',
              transition: 'all 0.15s',
            }}
          >
            <t.icon size={15} />
            {t.label}
            <span style={{
              fontSize: '0.72rem', fontWeight: 700,
              backgroundColor: tab === t.key ? ORANGE + '18' : '#F3F4F6',
              color: tab === t.key ? ORANGE : '#9CA3AF',
              padding: '1px 7px', borderRadius: 20,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ padding: '10px 28px', backgroundColor: '#F8F9FA', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'personas' ? 'Buscar por nombre, email u organización…' : 'Buscar por nombre de organización…'}
            style={{ width: '100%', paddingLeft: 30, paddingRight: 12, height: 34, border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
          />
        </div>
        <select
          value={filterActivo}
          onChange={e => setFilterActivo(e.target.value)}
          style={{ height: 34, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0 10px', fontSize: '0.84rem', color: '#374151', cursor: 'pointer', backgroundColor: '#fff' }}
        >
          <option value="">Todos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
        <button onClick={fetchClientes} style={{ height: 34, width: 34, border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={14} color="#6B7280" />
        </button>
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#9CA3AF' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} /> Cargando clientes...
          </div>

        ) : tab === 'personas' ? (
          /* ── Tab Personas ── */
          filteredPersonas.length === 0 ? (
            <EmptyState icon={User} title="No hay personas clientes" sub='Registrá el primero usando "+ Registrar Cliente"' />
          ) : (
            <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['Cliente', 'Contacto', 'Organización vinculada', 'Contexto', 'Alta', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonas.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{ borderBottom: i < filteredPersonas.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#FAFAFA'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = ''}
                    >
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={15} color={ORANGE} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                              {c.persona?.nombre ?? '—'} {c.persona?.apellido ?? ''}
                            </p>
                            {c.persona?.email && (
                              <p style={{ margin: 0, fontSize: '0.76rem', color: '#6B7280' }}>{c.persona.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                        {c.persona?.telefono ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} /> {c.persona.telefono}
                          </div>
                        ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        {c.organizacion ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Building2 size={13} color="#8B5CF6" />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#374151' }}>{c.organizacion.nombre}</span>
                          </div>
                        ) : <span style={{ color: '#D1D5DB', fontSize: '0.8rem' }}>Independiente</span>}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                        {c.contexto ?? <span style={{ color: '#D1D5DB' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#9CA3AF', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {new Date(c.created_at).toLocaleDateString('es-UY')}
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <button
                          onClick={() => toggleActivo(c)}
                          style={{ padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, backgroundColor: c.activo ? '#D1FAE5' : '#FEE2E2', color: c.activo ? '#10B981' : '#EF4444' }}
                        >
                          {c.activo ? '● Activo' : '● Inactivo'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )

        ) : (
          /* ── Tab Organizaciones ── */
          filteredOrgs.length === 0 ? (
            <EmptyState icon={Building2} title="No hay organizaciones clientes" sub='Registrá una asociando una organización al crear un cliente' />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredOrgs.map(org => {
                const activos   = org.roles.filter(r => r.activo).length;
                const contactos = org.roles.filter(r => r.persona_id).length;
                return (
                  <div
                    key={org.id}
                    style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}
                  >
                    {/* Cabecera org */}
                    <div style={{ padding: '14px 20px', borderBottom: org.roles.length > 0 ? '1px solid #F3F4F6' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={20} color="#8B5CF6" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.975rem' }}>{org.nombre}</p>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#9CA3AF' }}>
                          {org.tipo ?? 'Sin tipo'} · {contactos} contacto{contactos !== 1 ? 's' : ''} · {activos} activo{activos !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        backgroundColor: activos > 0 ? '#D1FAE5' : '#FEE2E2',
                        color: activos > 0 ? '#10B981' : '#EF4444',
                        padding: '3px 10px', borderRadius: 20,
                      }}>
                        {activos > 0 ? '● Activa' : '● Inactiva'}
                      </span>
                    </div>

                    {/* Contactos de esta org */}
                    {org.roles.filter(r => r.persona_id).length > 0 && (
                      <div style={{ padding: '8px 20px 12px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Contactos cliente
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {org.roles.filter(r => r.persona_id).map(r => (
                            <div
                              key={r.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}
                            >
                              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={13} color={ORANGE} />
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                                  {r.persona?.nombre} {r.persona?.apellido ?? ''}
                                </p>
                                {r.persona?.email && (
                                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B7280' }}>{r.persona.email}</p>
                                )}
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: 12, backgroundColor: r.activo ? '#D1FAE5' : '#FEE2E2', color: r.activo ? '#10B981' : '#EF4444', marginLeft: 4 }}>
                                {r.activo ? '●' : '○'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Modal Registrar Cliente ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Registrar Cliente</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9CA3AF' }}>Persona y/u organización con rol cliente</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label style={labelStyle}>Persona <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional si hay organización)</span></label>
                <select value={form.persona_id} onChange={e => setForm(f => ({ ...f, persona_id: e.target.value }))} style={selectStyle}>
                  <option value="">— Sin persona específica —</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido ?? ''} {p.email ? `(${p.email})` : ''}
                    </option>
                  ))}
                </select>
                {personas.length === 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#F59E0B' }}>
                    ⚠️ No hay personas.{' '}
                    <button onClick={() => { setShowModal(false); onNavigate('personas'); }} style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', fontWeight: 600, fontSize: '0.76rem', padding: 0 }}>
                      Crear una
                    </button>
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Organización <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional si hay persona)</span></label>
                <select value={form.organizacion_id} onChange={e => setForm(f => ({ ...f, organizacion_id: e.target.value }))} style={selectStyle}>
                  <option value="">— Sin organización —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
                {orgs.length === 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#F59E0B' }}>
                    ⚠️ No hay organizaciones.{' '}
                    <button onClick={() => { setShowModal(false); onNavigate('organizaciones'); }} style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', fontWeight: 600, fontSize: '0.76rem', padding: 0 }}>
                      Crear una
                    </button>
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Contexto / Nota</label>
                <input
                  value={form.contexto}
                  onChange={e => setForm(f => ({ ...f, contexto: e.target.value }))}
                  style={inputStyle}
                  placeholder="Ej: Canal mayorista, referido por…"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="cli-activo" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} style={{ width: 16, height: 16, accentColor: ORANGE, cursor: 'pointer' }} />
                <label htmlFor="cli-activo" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>Cliente activo</label>
              </div>

              <div style={{ padding: '10px 14px', backgroundColor: '#FFF7ED', borderRadius: 8, border: '1px solid #FDBA74', fontSize: '0.78rem', color: '#92400E' }}>
                💡 Podés registrar una <strong>persona cliente</strong>, una <strong>organización cliente</strong>, o ambas en el mismo registro.
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', backgroundColor: ORANGE, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                <Save size={15} /> {saving ? 'Guardando…' : 'Registrar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Empty state helper ── */
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
      <Icon size={44} style={{ marginBottom: 12, opacity: 0.25 }} />
      <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{title}</p>
      <p style={{ fontSize: '0.875rem', marginTop: 6 }}>{sub}</p>
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