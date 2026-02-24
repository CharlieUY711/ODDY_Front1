/* =====================================================
   Charlie Marketplace Builder v1.5
   AdminDashboard — Shell Principal
   ===================================================== */

import React, { useState } from 'react';
import { AdminSidebar }       from './components/admin/AdminSidebar';
import { DashboardView }      from './components/admin/views/DashboardView';
import { EcommerceView }      from './components/admin/views/EcommerceView';
import { MarketingView }      from './components/admin/views/MarketingView';
import { MarketingAvanzadoView } from './components/admin/views/MarketingAvanzadoView';
import { HerramientasView }   from './components/admin/views/HerramientasView';
import { QrGeneratorView }    from './components/admin/views/QrGeneratorView';
import { GestionView }        from './components/admin/views/GestionView';
import { POSView }            from './components/admin/views/POSView';
import { SistemaView }        from './components/admin/views/SistemaView';
import { DisenoView }         from './components/admin/views/DisenoView';
import { ChecklistView }      from './components/admin/views/ChecklistView';
import { IntegracionesView }  from './components/admin/views/IntegracionesView';
import { MigracionRRSSView }  from './components/admin/views/MigracionRRSSView';
import { MailingView }        from './components/admin/views/MailingView';
import { GoogleAdsView }      from './components/admin/views/GoogleAdsView';
import { RuedaSorteosView }   from './components/admin/views/RuedaSorteosView';
import { FidelizacionView }   from './components/admin/views/FidelizacionView';
import { RedesSocialesView }  from './components/admin/views/RedesSocialesView';
import { RRSSHubView }        from './components/admin/views/RRSSHubView';
import { DepartamentosView }  from './components/admin/views/DepartamentosView';
import { SecondHandView }     from './components/admin/views/SecondHandView';
import { ERPInventarioView }  from './components/admin/views/ERPInventarioView';
import { ERPFacturacionView } from './components/admin/views/ERPFacturacionView';
import { ERPComprasView }     from './components/admin/views/ERPComprasView';
import { ERPCRMView }         from './components/admin/views/ERPCRMView';
import { ERPContabilidadView } from './components/admin/views/ERPContabilidadView';
import { ERPRRHHView }        from './components/admin/views/ERPRRHHView';
import { ProyectosView }      from './components/admin/views/ProyectosView';
import { PersonasView }       from './components/admin/views/PersonasView';
import { OrganizacionesView } from './components/admin/views/OrganizacionesView';
import { ClientesView }       from './components/admin/views/ClientesView';
import { PedidosView }        from './components/admin/views/PedidosView';
import { MetodosPagoView }    from './components/admin/views/MetodosPagoView';
import { MetodosEnvioView }   from './components/admin/views/MetodosEnvioView';
import { PagosView }          from './components/admin/views/PagosView';
import { OrdenesMarketplaceView } from './components/admin/views/OrdenesMarketplaceView';
import { EnviosView }         from './components/admin/views/EnviosView';
import { LogisticaView }      from './components/admin/views/LogisticaView';
import { EtiquetaEmotivaView } from './components/admin/views/EtiquetaEmotivaView';
import { TransportistasView } from './components/admin/views/TransportistasView';
import { RutasView }          from './components/admin/views/RutasView';
import { FulfillmentView }    from './components/admin/views/FulfillmentView';
import { ProduccionView }     from './components/admin/views/ProduccionView';
import { AbastecimientoView } from './components/admin/views/AbastecimientoView';
import { MapaEnviosView }     from './components/admin/views/MapaEnviosView';
import { TrackingPublicoView } from './components/admin/views/TrackingPublicoView';
import { SEOView }            from './components/admin/views/SEOView';
import { IdeasBoardView }     from './components/admin/views/IdeasBoardView';
// ── Integraciones (5 módulos independientes) ──────────────────────────────
import { IntegracionesPagosView }      from './components/admin/views/IntegracionesPagosView';
import { IntegracionesLogisticaView }  from './components/admin/views/IntegracionesLogisticaView';
import { IntegracionesTiendasView }    from './components/admin/views/IntegracionesTiendasView';
import { IntegracionesRRSSView }       from './components/admin/views/IntegracionesRRSSView';
import { IntegracionesServiciosView }  from './components/admin/views/IntegracionesServiciosView';
// ── Workspace Suite (6 herramientas) ──────────────────────────────────────────
import { BibliotecaWorkspace }         from './components/admin/views/BibliotecaWorkspace';
import { EditorImagenesWorkspace }     from './components/admin/views/EditorImagenesWorkspace';
import { GenDocumentosWorkspace }      from './components/admin/views/GenDocumentosWorkspace';
import { GenPresupuestosWorkspace }    from './components/admin/views/GenPresupuestosWorkspace';
import { OCRWorkspace }                from './components/admin/views/OCRWorkspace';
import { ImpresionWorkspace }          from './components/admin/views/ImpresionWorkspace';
import { CatalogExtractorWorkspace }   from './components/admin/views/CatalogExtractorWorkspace';
// ── Auditoría & Diagnóstico ───────────────────────────────────────────────────
import { AuditoriaHubView }            from './components/admin/views/AuditoriaHubView';
import { HealthMonitorView }           from './components/admin/views/HealthMonitorView';
import { SystemLogsView }              from './components/admin/views/SystemLogsView';
// ── Repositorio de APIs ───────────────────────────────────────────────────────
import { RepositorioAPIsView }         from './components/admin/views/RepositorioAPIsView';
import { ConstructorView }             from './components/admin/views/ConstructorView';
import { AuthRegistroView }            from './components/admin/views/AuthRegistroView';
import { CargaMasivaView }             from './components/admin/views/CargaMasivaView';
import { MetaBusinessView }            from './components/admin/views/MetaBusinessView';
import { UnifiedWorkspaceView }        from './components/admin/views/UnifiedWorkspaceView';
import { AdminDashboardView }          from './components/admin/views/AdminDashboardView';
import { UserDashboardView }           from './components/admin/views/UserDashboardView';
import { ConfigVistasPorRolView }      from './components/admin/views/ConfigVistasPorRolView';
import { DocumentacionView }           from './components/admin/views/DocumentacionView';
import { MetaMapView }                 from './components/admin/views/MetaMapView';
import { Toaster } from 'sonner';

export type MainSection =
  | 'dashboard'
  | 'ecommerce'
  | 'marketing'
  | 'marketing-avanzado'
  | 'herramientas'
  | 'qr-generator'
  | 'gestion'
  | 'pos'
  | 'sistema'
  | 'diseno'
  | 'checklist'
  | 'integraciones'
  | 'migracion-rrss'
  | 'mailing'
  | 'google-ads'
  | 'rueda-sorteos'
  | 'fidelizacion'
  | 'redes-sociales'
  | 'rrss'
  | 'departamentos'
  | 'secondhand'
  | 'erp-inventario'
  | 'erp-facturacion'
  | 'erp-compras'
  | 'erp-crm'
  | 'erp-contabilidad'
  | 'erp-rrhh'
  | 'proyectos'
  | 'personas'
  | 'organizaciones'
  | 'clientes'
  | 'pedidos'
  | 'metodos-pago'
  | 'metodos-envio'
  | 'pagos'
  | 'ordenes-marketplace'
  | 'envios'
  | 'logistica'
  | 'transportistas'
  | 'rutas'
  | 'produccion'
  | 'abastecimiento'
  | 'mapa-envios'
  | 'tracking-publico'
  | 'fulfillment'
  | 'seo'
  | 'etiqueta-emotiva'
  | 'roadmap'
  | 'ideas-board'
  | 'integraciones-pagos'
  | 'integraciones-logistica'
  | 'integraciones-tiendas'
  | 'integraciones-rrss'
  | 'integraciones-servicios'
  // ── Workspace Suite ──────────────────────────────────────────────────────────
  | 'biblioteca'
  | 'editor-imagenes'
  | 'gen-documentos'
  | 'gen-presupuestos'
  | 'ocr'
  | 'impresion'
  | 'extraer-catalogo'
  // ── Auditoría & Diagnóstico ───────────────────────────────────────────────────
  | 'auditoria'
  | 'auditoria-health'
  | 'auditoria-logs'
  // ── Repositorio de APIs ───────────────────────────────────────────────────────
  | 'integraciones-apis'
  // ── Constructor ───────────────────────────────────────────────────────────────
  | 'constructor'
  // ── Nuevos módulos v2 ─────────────────────────────────────────────────────────
  | 'auth-registro'
  | 'carga-masiva'
  | 'meta-business'
  | 'unified-workspace'
  // ── Sistema: Dashboards + Config + Docs ───────────────────────────────────────
  | 'dashboard-admin'
  | 'dashboard-usuario'
  | 'config-vistas'
  | 'documentacion'
  | 'metamap-config';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<MainSection>('dashboard');
  const nav = (s: MainSection) => setActiveSection(s);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8F9FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif' }}>
        <AdminSidebar activeSection={activeSection} onNavigate={nav} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {activeSection === 'dashboard'       && <DashboardView      onNavigate={nav} />}
          {activeSection === 'ecommerce'       && <EcommerceView      onNavigate={nav} />}
          {activeSection === 'marketing'       && <MarketingView      onNavigate={nav} />}
          {activeSection === 'marketing-avanzado' && <MarketingAvanzadoView onNavigate={nav} />}
          {activeSection === 'herramientas'    && <HerramientasView   onNavigate={nav} />}
          {activeSection === 'qr-generator'    && <QrGeneratorView    onNavigate={nav} />}
          {activeSection === 'gestion'         && <GestionView        onNavigate={nav} />}
          {activeSection === 'pos'             && <POSView            onNavigate={nav} />}
          {activeSection === 'sistema'         && <SistemaView        onNavigate={nav} />}
          {activeSection === 'diseno'          && <DisenoView         onNavigate={nav} />}
          {activeSection === 'checklist'       && <ChecklistView      onNavigate={nav} />}
          {activeSection === 'roadmap'         && <ChecklistView      onNavigate={nav} />}
          {activeSection === 'integraciones'   && <IntegracionesView  onNavigate={nav} />}
          {activeSection === 'migracion-rrss'  && <MigracionRRSSView  onNavigate={nav} />}
          {activeSection === 'mailing'         && <MailingView        onNavigate={nav} />}
          {activeSection === 'google-ads'      && <GoogleAdsView      onNavigate={nav} />}
          {activeSection === 'rueda-sorteos'   && <RuedaSorteosView   onNavigate={nav} />}
          {activeSection === 'fidelizacion'    && <FidelizacionView   onNavigate={nav} />}
          {activeSection === 'redes-sociales'  && <RedesSocialesView  onNavigate={nav} />}
          {activeSection === 'rrss'            && <RRSSHubView        onNavigate={nav} />}
          {activeSection === 'departamentos'   && <DepartamentosView  onNavigate={nav} />}
          {activeSection === 'secondhand'      && <SecondHandView     onNavigate={nav} />}
          {activeSection === 'erp-inventario'  && <ERPInventarioView  onNavigate={nav} />}
          {activeSection === 'erp-facturacion' && <ERPFacturacionView onNavigate={nav} />}
          {activeSection === 'erp-compras'     && <ERPComprasView     onNavigate={nav} />}
          {activeSection === 'erp-crm'         && <ERPCRMView         onNavigate={nav} />}
          {activeSection === 'erp-contabilidad'&& <ERPContabilidadView onNavigate={nav} />}
          {activeSection === 'erp-rrhh'        && <ERPRRHHView        onNavigate={nav} />}
          {activeSection === 'proyectos'       && <ProyectosView      onNavigate={nav} />}
          {activeSection === 'personas'        && <PersonasView        onNavigate={nav} />}
          {activeSection === 'organizaciones'  && <OrganizacionesView  onNavigate={nav} />}
          {activeSection === 'clientes'        && <ClientesView        onNavigate={nav} />}
          {activeSection === 'pedidos'         && <PedidosView         onNavigate={nav} />}
          {activeSection === 'metodos-pago'    && <MetodosPagoView     onNavigate={nav} />}
          {activeSection === 'metodos-envio'   && <MetodosEnvioView    onNavigate={nav} />}
          {activeSection === 'pagos'           && <PagosView           onNavigate={nav} />}
          {activeSection === 'ordenes-marketplace' && <OrdenesMarketplaceView onNavigate={nav} />}
          {activeSection === 'envios'          && <EnviosView          onNavigate={nav} />}
          {activeSection === 'logistica'       && <LogisticaView       onNavigate={nav} />}
          {activeSection === 'transportistas'  && <TransportistasView  onNavigate={nav} />}
          {activeSection === 'rutas'           && <RutasView           onNavigate={nav} />}
          {activeSection === 'produccion'      && <ProduccionView      onNavigate={nav} />}
          {activeSection === 'abastecimiento'  && <AbastecimientoView  onNavigate={nav} />}
          {activeSection === 'mapa-envios'     && <MapaEnviosView      onNavigate={nav} />}
          {activeSection === 'tracking-publico'&& <TrackingPublicoView onNavigate={nav} />}
          {activeSection === 'fulfillment'     && <FulfillmentView     onNavigate={nav} />}
          {activeSection === 'seo'             && <SEOView             onNavigate={nav} />}
          {activeSection === 'etiqueta-emotiva'&& <EtiquetaEmotivaView onNavigate={nav} />}
          {activeSection === 'ideas-board'             && <IdeasBoardView             onNavigate={nav} />}
          {activeSection === 'integraciones-pagos'     && <IntegracionesPagosView     onNavigate={nav} />}
          {activeSection === 'integraciones-logistica' && <IntegracionesLogisticaView onNavigate={nav} />}
          {activeSection === 'integraciones-tiendas'   && <IntegracionesTiendasView   onNavigate={nav} />}
          {activeSection === 'integraciones-rrss'      && <IntegracionesRRSSView      onNavigate={nav} />}
          {activeSection === 'integraciones-servicios' && <IntegracionesServiciosView onNavigate={nav} />}
          {/* ── Workspace Suite ── */}
          {activeSection === 'biblioteca'              && <BibliotecaWorkspace        onNavigate={nav} />}
          {activeSection === 'editor-imagenes'         && <EditorImagenesWorkspace    onNavigate={nav} />}
          {activeSection === 'gen-documentos'          && <GenDocumentosWorkspace     onNavigate={nav} />}
          {activeSection === 'gen-presupuestos'        && <GenPresupuestosWorkspace   onNavigate={nav} />}
          {activeSection === 'ocr'                     && <OCRWorkspace               onNavigate={nav} />}
          {activeSection === 'impresion'               && <ImpresionWorkspace         onNavigate={nav} />}
          {activeSection === 'extraer-catalogo'        && <CatalogExtractorWorkspace  onNavigate={nav} />}
          {/* ── Auditoría & Diagnóstico ── */}
          {activeSection === 'auditoria'               && <AuditoriaHubView           onNavigate={nav} />}
          {activeSection === 'auditoria-health'        && <HealthMonitorView          onNavigate={nav} />}
          {activeSection === 'auditoria-logs'          && <SystemLogsView             onNavigate={nav} />}
          {/* ── Repositorio de APIs ── */}
          {activeSection === 'integraciones-apis'      && <RepositorioAPIsView        onNavigate={nav} />}
          {/* ── Constructor ── */}
          {activeSection === 'constructor'             && <ConstructorView            onNavigate={nav} />}
          {/* ── Nuevos módulos v2 ── */}
          {activeSection === 'auth-registro'           && <AuthRegistroView           onNavigate={nav} />}
          {activeSection === 'carga-masiva'            && <CargaMasivaView            onNavigate={nav} />}
          {activeSection === 'meta-business'           && <MetaBusinessView           onNavigate={nav} />}
          {activeSection === 'unified-workspace'       && <UnifiedWorkspaceView       onNavigate={nav} />}
          {/* ── Sistema: Dashboards + Config + Docs ── */}
          {activeSection === 'dashboard-admin'         && <AdminDashboardView         onNavigate={nav} />}
          {activeSection === 'dashboard-usuario'       && <UserDashboardView          onNavigate={nav} />}
          {activeSection === 'config-vistas'           && <ConfigVistasPorRolView     onNavigate={nav} />}
          {activeSection === 'documentacion'           && <DocumentacionView          onNavigate={nav} />}
          {activeSection === 'metamap-config'          && <MetaMapView                onNavigate={nav} />}
        </main>
      </div>
    </>
  );
}
