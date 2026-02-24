/**
 * 🖼️ Editor de Imágenes Pro v5
 * Herramientas clásicas · Drag & drop · Watermark editable · Native filter select
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import type { MainSection } from '../../../AdminDashboard';
import {
  Upload, FlipHorizontal, FlipVertical, Download,
  ZoomIn, ZoomOut, RotateCcw, RotateCw, Eraser, Loader,
  Lock, Zap, Plus, X, CheckSquare, Square,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  MousePointer, Crop, Move, Hand, Type, Pipette, Droplets,
  Undo2, Trash2,
} from 'lucide-react';

interface Props { onNavigate: (s: MainSection) => void; }

/* ══════════ TYPES ══════════ */
interface Adjustments {
  brightness: number; contrast: number; saturation: number;
  hue: number; blur: number; sepia: number; opacity: number;
}
const DEFAULT_ADJ: Adjustments = {
  brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, opacity: 100,
};

interface TextItem {
  id: string; content: string;
  x: number; y: number;         // % from frame origin
  fontFamily: string; fontSize: number;
  bold: boolean; italic: boolean; underline: boolean;
  align: 'left' | 'center' | 'right';
  color: string; rotation: number; opacity: number;
}

interface SlotState {
  src: string; adj: Adjustments;
  rotation: number; flipH: boolean; flipV: boolean; label: string;
}

type ToolId = 'select' | 'crop' | 'transform' | 'pan' | 'text' | 'eyedrop' | 'watermark';

/* ══════════ CONSTANTS ══════════ */
const CANVAS_TEMPLATES = [
  { id: 'square', name: 'Web Cuadrado', w: 1200, h: 1200, shape: 'rect',   desc: '1200 × 1200' },
  { id: 'story',  name: 'Story 9:10',  w: 1080, h: 1200, shape: 'rect',   desc: '1080 × 1200' },
  { id: 'header', name: 'Encabezado',  w: 1200, h: 400,  shape: 'rect',   desc: '1200 × 400'  },
  { id: 'footer', name: 'Pie',         w: 1200, h: 300,  shape: 'rect',   desc: '1200 × 300'  },
  { id: 'label',  name: 'Etiq. Envío', w: 150,  h: 100,  shape: 'rect',   desc: '150 × 100 mm'},
  { id: 'circle', name: 'Circular',    w: 1200, h: 1200, shape: 'circle', desc: '⭕ 1200×1200' },
];

const FILTER_PRESETS = [
  { name: 'Original', values: DEFAULT_ADJ },
  { name: 'Vívido',   values: { ...DEFAULT_ADJ, brightness: 110, contrast: 115, saturation: 150 } },
  { name: 'Cool',     values: { ...DEFAULT_ADJ, hue: 190, saturation: 120 } },
  { name: 'Cálido',   values: { ...DEFAULT_ADJ, hue: 20, brightness: 105, saturation: 110 } },
  { name: 'B&N',      values: { ...DEFAULT_ADJ, saturation: 0 } },
  { name: 'Vintage',  values: { ...DEFAULT_ADJ, sepia: 60, contrast: 90, brightness: 95 } },
  { name: 'Fade',     values: { ...DEFAULT_ADJ, contrast: 80, brightness: 105, saturation: 80, opacity: 90 } },
  { name: 'Noir',     values: { ...DEFAULT_ADJ, saturation: 0, contrast: 130, brightness: 90 } },
];

const FONT_FAMILIES = ['Arial', 'Georgia', 'Verdana', 'Courier New', 'Impact', 'Trebuchet MS', 'Palatino', 'Tahoma'];

const SLOT_LABELS = ['Original', 'Auto', 'V1', 'V2', 'V3', 'V4'];
const SLOT_ICONS  = [Lock, Zap, Plus, Plus, Plus, Plus];

/* tools: icon + label for tooltip, no visible text */
const TOOLS: { id: ToolId; Icon: React.FC<{size?:number}>; tip: string }[] = [
  { id: 'select',    Icon: MousePointer, tip: 'Selección (V)'  },
  { id: 'crop',      Icon: Crop,         tip: 'Recorte (C)'    },
  { id: 'transform', Icon: Move,         tip: 'Transformar (T)'},
  { id: 'pan',       Icon: Hand,         tip: 'Mano (H)'       },
  { id: 'text',      Icon: Type,         tip: 'Texto (X)'      },
  { id: 'eyedrop',   Icon: Pipette,      tip: 'Cuentagotas (E)'},
  { id: 'watermark', Icon: Droplets,     tip: 'Marca de agua'  },
];

/* ══════════ UTILS ══════════ */
function buildFilter(a: Adjustments) {
  return `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturation}%) hue-rotate(${a.hue}deg) blur(${a.blur}px) sepia(${a.sepia}%) opacity(${a.opacity}%)`;
}
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
function aspectStr(w: number, h: number) {
  const d = gcd(w, h), rw = w / d, rh = h / d;
  return (rw > 20 || rh > 20) ? `${(w / h).toFixed(2)}:1` : `${rw}:${rh}`;
}
function uid() { return Math.random().toString(36).slice(2, 9); }

/* ══════════ BFS BG REMOVAL ══════════ */
async function removeBg(src: string, tol = 58): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 2000, sc = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const W = Math.round(img.naturalWidth * sc), H = Math.round(img.naturalHeight * sc);
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, W, H);
      const imgData = ctx.getImageData(0, 0, W, H); const px = imgData.data;
      // median border color
      const samps: [number, number, number][] = [];
      const addS = (x: number, y: number) => { const i = (y*W+x)*4; samps.push([px[i], px[i+1], px[i+2]]); };
      for (let x = 0; x < W; x++) { addS(x, 0); addS(x, H-1); }
      for (let y = 1; y < H-1; y++) { addS(0, y); addS(W-1, y); }
      samps.sort((a, b) => (0.299*a[0]+0.587*a[1]+0.114*a[2]) - (0.299*b[0]+0.587*b[1]+0.114*b[2]));
      const [bgR, bgG, bgB] = samps[samps.length >> 1];
      const dist = (i: number) => { const dr=px[i]-bgR, dg=px[i+1]-bgG, db=px[i+2]-bgB; return Math.sqrt(dr*dr+dg*dg+db*db); };
      // BFS
      const visited = new Uint8Array(W*H); const queue = new Int32Array(W*H*2); let head = 0, tail = 0;
      const enq = (p: number) => { if (p >= 0 && p < W*H && !visited[p]) { visited[p]=1; queue[tail++]=p; } };
      for (let x = 0; x < W; x++) { enq(x); enq((H-1)*W+x); }
      for (let y = 1; y < H-1; y++) { enq(y*W); enq(y*W+W-1); }
      while (head < tail) {
        const pos = queue[head++]; const x = pos%W; const y = (pos/W)|0;
        if (dist(pos*4) <= tol) { px[pos*4+3]=0; if(x>0)enq(pos-1); if(x<W-1)enq(pos+1); if(y>0)enq(pos-W); if(y<H-1)enq(pos+W); }
      }
      // edge feather
      const snap = new Uint8Array(W*H); for (let i = 0; i < W*H; i++) snap[i] = px[i*4+3];
      for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
        const pos = y*W+x;
        if (snap[pos] > 0 && (snap[pos-1]===0||snap[pos+1]===0||snap[pos-W]===0||snap[pos+W]===0)) {
          const d = dist(pos*4), t = tol*0.6;
          px[pos*4+3] = Math.round(255 * Math.min(1, Math.max(0, (d-t)/(tol-t))));
        }
      }
      ctx.putImageData(imgData, 0, 0); resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('load')); img.src = src;
  });
}

async function autoAdjust(src: string): Promise<Adjustments> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const S = 80, c = document.createElement('canvas'); c.width = S; c.height = S;
      const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, S, S);
      const { data } = ctx.getImageData(0, 0, S, S); let sumL = 0, sumSq = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] < 80) continue;
        const l = (0.299*data[i]+0.587*data[i+1]+0.114*data[i+2])/255;
        sumL += l; sumSq += l*l; n++;
      }
      if (!n) { resolve(DEFAULT_ADJ); return; }
      const mean = sumL/n; const std = Math.sqrt(Math.max(0, sumSq/n - mean*mean));
      let brightness = 100, contrast = 100;
      if (mean < 0.35) brightness = Math.min(130, Math.round(0.42/(mean+0.01)*100));
      else if (mean > 0.78) brightness = Math.max(80, Math.round(0.6/(mean+0.01)*100));
      if (std < 0.1) contrast = 118; else if (std > 0.38) contrast = 90;
      resolve({ ...DEFAULT_ADJ, brightness, contrast, saturation: 108 });
    };
    img.onerror = () => resolve(DEFAULT_ADJ); img.src = src;
  });
}

/* ══════════ LEFT PANEL ══════════ */
function LeftPanel({
  adj, setAdj, presetName, setPresetName,
  onUpload, onRemoveBg, processing, hasImage,
  bgTolerance, setBgTolerance, bgColor, setBgColor,
  activeTool, setActiveTool,
}: {
  adj: Adjustments; setAdj: (a: Adjustments) => void;
  presetName: string; setPresetName: (n: string) => void;
  onUpload: () => void; onRemoveBg: () => void;
  processing: boolean; hasImage: boolean;
  bgTolerance: number; setBgTolerance: (v: number) => void;
  bgColor: string; setBgColor: (c: string) => void;
  activeTool: ToolId; setActiveTool: (t: ToolId) => void;
}) {
  const Slider = (key: keyof Adjustments, label: string, min: number, max: number, step = 1) => (
    <div key={key} style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <label style={{ fontSize: '0.65rem', fontWeight: '600', color: '#374151' }}>{label}</label>
        <span style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: '600' }}>
          {adj[key]}{key==='hue'?'°':key==='blur'?'px':'%'}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={adj[key]}
        onChange={e => { setAdj({ ...adj, [key]: Number(e.target.value) }); setPresetName(''); }}
        style={{ width: '100%', accentColor: '#FF6835', cursor: 'pointer', height: 3 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>

        {/* Upload */}
        <button onClick={onUpload}
          style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px',borderRadius:8,border:'1.5px dashed #FFD4C2',backgroundColor:'#FFF4F0',color:'#FF6835',cursor:'pointer',fontSize:'0.75rem',fontWeight:'700',marginBottom:8 }}>
          <Upload size={13}/> Cargar imagen
        </button>

        {/* Remove BG */}
        <button onClick={onRemoveBg} disabled={!hasImage||processing}
          style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px',borderRadius:8,border:`1.5px solid ${hasImage&&!processing?'#818CF8':'#E5E7EB'}`,backgroundColor:hasImage&&!processing?'#EEF2FF':'#F9FAFB',color:hasImage&&!processing?'#4F46E5':'#9CA3AF',cursor:hasImage&&!processing?'pointer':'not-allowed',fontSize:'0.75rem',fontWeight:'700',marginBottom:6 }}>
          {processing
            ? <><Loader size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Procesando...</>
            : <><Eraser size={13}/> Quitar fondo</>}
        </button>

        {/* Tolerance */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
            <label style={{ fontSize:'0.62rem', fontWeight:'600', color:'#6B7280' }}>Tolerancia</label>
            <span style={{ fontSize:'0.62rem', color:'#9CA3AF', fontWeight:'600' }}>{bgTolerance}</span>
          </div>
          <input type="range" min={5} max={120} step={1} value={bgTolerance}
            onChange={e=>setBgTolerance(Number(e.target.value))}
            style={{ width:'100%', accentColor:'#4F46E5', cursor:'pointer', height:3 }}/>
        </div>

        {/* BG Color */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize:'0.62rem', fontWeight:'700', color:'#6B7280', display:'block', marginBottom:5 }}>Color de fondo</label>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <button onClick={()=>setBgColor('')} title="Transparente"
              style={{ width:22,height:22,borderRadius:4,border:`2px solid ${bgColor===''?'#FF6835':'#E5E7EB'}`,backgroundImage:'repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%)',backgroundSize:'6px 6px',cursor:'pointer',flexShrink:0 }}/>
            <label style={{ position:'relative',cursor:'pointer',width:22,height:22,flexShrink:0 }}>
              <div style={{ width:22,height:22,borderRadius:4,border:`2px solid ${bgColor?'#FF6835':'#E5E7EB'}`,backgroundColor:bgColor||'#fff' }}/>
              <input type="color" value={bgColor||'#ffffff'} onChange={e=>setBgColor(e.target.value)}
                style={{ position:'absolute',inset:0,opacity:0,width:'100%',height:'100%',cursor:'pointer' }}/>
            </label>
            {['#ffffff','#f5f5f5','#000000','#f0ede8'].map(c=>(
              <button key={c} onClick={()=>setBgColor(c)}
                style={{ width:18,height:18,borderRadius:3,border:`1.5px solid ${bgColor===c?'#FF6835':'#D1D5DB'}`,backgroundColor:c,cursor:'pointer',flexShrink:0 }}/>
            ))}
          </div>
        </div>

        {/* Filters — native <select> (no z-index issues) */}
        <div style={{ marginBottom: 12 }}>
          <label style={sLbl}>Filtro</label>
          <select
            value={presetName}
            onChange={e => {
              const name = e.target.value;
              const preset = FILTER_PRESETS.find(p => p.name === name);
              if (preset) { setAdj(preset.values); setPresetName(name); }
            }}
            style={{ width:'100%',padding:'7px 10px',borderRadius:7,border:'1px solid #E5E7EB',backgroundColor:'#F9FAFB',color:'#374151',fontSize:'0.72rem',fontWeight:'600',cursor:'pointer',outline:'none',appearance:'auto' }}>
            <option value="">— Seleccionar filtro —</option>
            {FILTER_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Adjustments */}
        <p style={sLbl}>Ajustes</p>
        {Slider('brightness','Brillo',0,200)}
        {Slider('contrast','Contraste',0,200)}
        {Slider('saturation','Saturación',0,200)}
        {Slider('hue','Tono',-180,180)}
        {Slider('sepia','Sepia',0,100)}
        {Slider('blur','Desenfoque',0,20)}
        {Slider('opacity','Opacidad',10,100)}

        <button onClick={()=>{ setAdj(DEFAULT_ADJ); setPresetName('Original'); }}
          style={{ width:'100%',padding:'6px',borderRadius:7,border:'1px solid #E5E7EB',backgroundColor:'#F9FAFB',color:'#6B7280',cursor:'pointer',fontSize:'0.72rem',fontWeight:'600',marginBottom:16 }}>
          ↺ Restablecer ajustes
        </button>

        {/* Classic Tools — icon only */}
        <p style={sLbl}>Herramientas</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
          {TOOLS.map(({ id, Icon, tip }) => {
            const active = activeTool === id;
            const isWatermark = id === 'watermark';
            return (
              <button key={id} onClick={()=>setActiveTool(id)} title={tip}
                style={{ height:36,borderRadius:7,border:`1.5px solid ${active?(isWatermark?'#10B981':'#FF6835'):'#E5E7EB'}`,backgroundColor:active?(isWatermark?'#10B981':'#FF6835'):'#F9FAFB',color:active?'#fff':'#374151',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.1s' }}>
                <Icon size={15}/>
              </button>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════ SLOT STRIP ══════════ */
function SlotStrip({ slots, activeSlot, slotSize, onSlotClick }: {
  slots: (SlotState|null)[]; activeSlot: number; slotSize: number; onSlotClick: (i:number)=>void;
}) {
  return (
    <div style={{ width:slotSize,flexShrink:0,display:'flex',flexDirection:'column',backgroundColor:'#ADADAD',borderRight:'1px solid #989898' }}>
      {slots.map((slot,i)=>{
        const Icon = SLOT_ICONS[i]; const isActive = i===activeSlot;
        return (
          <div key={i} onClick={()=>onSlotClick(i)} title={SLOT_LABELS[i]}
            style={{ width:slotSize,height:slotSize,flexShrink:0,position:'relative',cursor:'pointer',boxSizing:'border-box',backgroundColor:'#C0C0C0',overflow:'hidden',outline:isActive?'3px solid #FF6835':'2px solid transparent',outlineOffset:'-2px',transition:'outline-color 0.1s' }}>
            {slot ? (
              <div style={{ position:'absolute',inset:0,backgroundImage:'repeating-conic-gradient(#AAAAAA 0% 25%,transparent 0% 50%)',backgroundSize:'8px 8px' }}>
                <img src={slot.src} alt="" draggable={false}
                  style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',filter:buildFilter(slot.adj),transform:`rotate(${slot.rotation}deg) scaleX(${slot.flipH?-1:1}) scaleY(${slot.flipV?-1:1})` }}/>
              </div>
            ) : (
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Icon size={Math.round(slotSize*0.28)} style={{ color:'#777',opacity:0.55 }}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════ CANVAS AREA ══════════ */
type DragInfo =
  | { kind: 'image'; ox: number; oy: number }
  | { kind: 'text';  id: string; ox: number; oy: number };

function CanvasArea({
  imageSrc, adj, rotation, setRotation, flipH, setFlipH, flipV, setFlipV,
  zoom, onZoom, onLoad, imgDims,
  slots, activeSlot, onSlotClick,
  selectedTemplate, processing, bgColor,
  activeTool, setActiveTool,
  selectedId, setSelectedId,
  imagePos, setImagePos,
  textItems, setTextItems,
  fontFamily, setFontFamily, fontSize, setFontSize,
  fontBold, setFontBold, fontItalic, setFontItalic, fontUnderline, setFontUnderline,
  textAlign, setTextAlign, textColor, setTextColor,
  onUndo, onClear, onDelete, canUndo, hasSelected,
}: {
  imageSrc: string|null; adj: Adjustments;
  rotation: number; setRotation: (r:number)=>void;
  flipH: boolean; setFlipH: (v:boolean)=>void;
  flipV: boolean; setFlipV: (v:boolean)=>void;
  zoom: number; onZoom: (z:number)=>void;
  onLoad: (w:number,h:number)=>void;
  imgDims: {w:number;h:number}|null;
  slots: (SlotState|null)[]; activeSlot: number; onSlotClick: (i:number)=>void;
  selectedTemplate: string; processing: boolean; bgColor: string;
  activeTool: ToolId; setActiveTool: (t:ToolId)=>void;
  selectedId: string|null; setSelectedId: (id:string|null)=>void;
  imagePos: {x:number;y:number}; setImagePos: (p:{x:number;y:number})=>void;
  textItems: TextItem[]; setTextItems: React.Dispatch<React.SetStateAction<TextItem[]>>;
  fontFamily: string; setFontFamily: (v:string)=>void;
  fontSize: number; setFontSize: (v:number)=>void;
  fontBold: boolean; setFontBold: (v:boolean)=>void;
  fontItalic: boolean; setFontItalic: (v:boolean)=>void;
  fontUnderline: boolean; setFontUnderline: (v:boolean)=>void;
  textAlign: 'left'|'center'|'right'; setTextAlign: (v:'left'|'center'|'right')=>void;
  textColor: string; setTextColor: (v:string)=>void;
  onUndo: ()=>void; onClear: ()=>void; onDelete: ()=>void;
  canUndo: boolean; hasSelected: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef   = useRef<HTMLDivElement>(null);
  const [slotSize, setSlotSize] = useState(80);
  const [frameW, setFrameW]     = useState(400);
  const [frameH, setFrameH]     = useState(400);
  const [dragInfo, setDragInfo] = useState<{ info: DragInfo; startX: number; startY: number }|null>(null);

  const tpl = CANVAS_TEMPLATES.find(t=>t.id===selectedTemplate)??CANVAS_TEMPLATES[0];

  useEffect(()=>{
    const el=contentRef.current; if (!el) return;
    const update=()=>{
      const {width,height}=el.getBoundingClientRect();
      const ss=Math.max(52,Math.floor(height/6)); setSlotSize(ss);
      const avW=width-ss-28; const avH=height-16;
      const ratio=tpl.w/tpl.h;
      if (avW/avH>ratio){const fh=avH;setFrameH(fh);setFrameW(Math.round(fh*ratio));}
      else              {const fw=avW;setFrameW(fw);setFrameH(Math.round(fw/ratio));}
    };
    update();
    const obs=new ResizeObserver(update); obs.observe(el);
    return ()=>obs.disconnect();
  },[tpl.w,tpl.h]);

  /* Drag start on image */
  const onImageMouseDown=(e:React.MouseEvent)=>{
    if (activeTool!=='select') return;
    e.preventDefault(); e.stopPropagation();
    setSelectedId('image');
    setDragInfo({ info:{ kind:'image', ox:imagePos.x, oy:imagePos.y }, startX:e.clientX, startY:e.clientY });
  };

  /* Drag start on text item */
  const onTextMouseDown=(e:React.MouseEvent, item:TextItem)=>{
    if (activeTool!=='select') return;
    e.preventDefault(); e.stopPropagation();
    setSelectedId(item.id);
    setDragInfo({ info:{ kind:'text', id:item.id, ox:item.x, oy:item.y }, startX:e.clientX, startY:e.clientY });
  };

  /* Mouse move on frame */
  const onFrameMove=(e:React.MouseEvent)=>{
    if (!dragInfo || !frameRef.current) return;
    const fr=frameRef.current.getBoundingClientRect();
    const dx=e.clientX-dragInfo.startX; const dy=e.clientY-dragInfo.startY;
    if (dragInfo.info.kind==='image') {
      setImagePos({ x:dragInfo.info.ox+dx, y:dragInfo.info.oy+dy });
    } else {
      const pdx=dx/fr.width*100; const pdy=dy/fr.height*100;
      setTextItems(prev=>prev.map(t=>t.id===dragInfo.info.id
        ? {...t, x:dragInfo.info.ox+pdx, y:dragInfo.info.oy+pdy }
        : t
      ));
    }
  };

  const onFrameUp=()=>setDragInfo(null);

  /* Click on empty frame area: add text (text tool) OR deselect */
  const onFrameClick=(e:React.MouseEvent)=>{
    if (e.target!==frameRef.current) return;
    if (activeTool==='watermark') {
      const fr=frameRef.current!.getBoundingClientRect();
      const wm:TextItem={
        id:'wm_'+uid(), content:'© MARCA DE AGUA',
        x:(e.clientX-fr.left)/fr.width*100, y:(e.clientY-fr.top)/fr.height*100,
        fontFamily:'Arial', fontSize:80, bold:true, italic:false, underline:false,
        align:'center', color:'rgba(255,255,255,0.4)', rotation:-30, opacity:55,
      };
      setTextItems(prev=>[...prev,wm]); setSelectedId(wm.id); setActiveTool('select'); return;
    }
    if (activeTool==='text') {
      const fr=frameRef.current!.getBoundingClientRect();
      const newItem:TextItem={
        id:uid(), content:'Texto',
        x:(e.clientX-fr.left)/fr.width*100, y:(e.clientY-fr.top)/fr.height*100,
        fontFamily, fontSize, bold:fontBold, italic:fontItalic, underline:fontUnderline,
        align:textAlign, color:textColor, rotation:0, opacity:100,
      };
      setTextItems(prev=>[...prev,newItem]); setSelectedId(newItem.id);
    } else {
      setSelectedId(null);
    }
  };

  const imgTransform=`rotate(${rotation}deg) scaleX(${flipH?-1:1}) scaleY(${flipV?-1:1})`;
  const aspectLabel=imgDims?aspectStr(imgDims.w,imgDims.h):null;
  const cursorMap:Record<ToolId,string>={ select:'default',crop:'crosshair',transform:'move',pan:'grab',text:'text',eyedrop:'crosshair',watermark:'copy' };

  const tgl=(active:boolean):React.CSSProperties=>({
    ...tbBtn, backgroundColor:active?'#FFF4F0':'#fff',
    color:active?'#FF6835':'#374151', border:`1px solid ${active?'#FFD4C2':'#E5E7EB'}`
  });

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',overflow:'hidden' }}>

      {/* ── SINGLE TOOLBAR ── */}
      <div style={{ height:44,backgroundColor:'#fff',borderBottom:'1px solid #E5E7EB',display:'flex',alignItems:'center',padding:'0 10px',gap:4,flexShrink:0,overflowX:'auto',overflowY:'hidden' }}>
        {/* Zoom */}
        <button onClick={()=>onZoom(Math.max(25,zoom-10))} style={tbBtn}><ZoomOut size={13}/></button>
        <span style={tbVal}>{zoom}%</span>
        <button onClick={()=>onZoom(Math.min(200,zoom+10))} style={tbBtn}><ZoomIn size={13}/></button>
        <input type="range" min={25} max={200} step={5} value={zoom} onChange={e=>onZoom(Number(e.target.value))}
          style={{ width:65,accentColor:'#FF6835',cursor:'pointer',flexShrink:0 }}/>
        <button onClick={()=>onZoom(100)} style={{ ...tbBtn,fontSize:'0.62rem',fontWeight:'700',padding:'3px 6px',width:'auto' }}>1:1</button>
        <div style={tbSep}/>
        {/* Rotation */}
        <button onClick={()=>setRotation((rotation-1+360)%360)} style={tbBtn}><RotateCcw size={13}/></button>
        <span style={tbVal}>{rotation}°</span>
        <button onClick={()=>setRotation((rotation+1)%360)} style={tbBtn}><RotateCw size={13}/></button>
        <input type="range" min={0} max={360} step={1} value={rotation}
          onChange={e=>{const v=Number(e.target.value);setRotation(v>=360?0:v);}}
          style={{ width:65,accentColor:'#FF6835',cursor:'pointer',flexShrink:0 }}/>
        <button onClick={()=>setRotation(0)} style={{ ...tbBtn,fontSize:'0.62rem',fontWeight:'700',padding:'3px 6px',width:'auto' }}>0°</button>
        <div style={tbSep}/>
        {/* Flip */}
        <button onClick={()=>setFlipH(!flipH)} title="Flip H"
          style={{ ...tbBtn,backgroundColor:flipH?'#EFF6FF':'#fff',color:flipH?'#3B82F6':'#374151',border:`1px solid ${flipH?'#BFDBFE':'#E5E7EB'}` }}>
          <FlipHorizontal size={14}/>
        </button>
        <button onClick={()=>setFlipV(!flipV)} title="Flip V"
          style={{ ...tbBtn,backgroundColor:flipV?'#EFF6FF':'#fff',color:flipV?'#3B82F6':'#374151',border:`1px solid ${flipV?'#BFDBFE':'#E5E7EB'}` }}>
          <FlipVertical size={14}/>
        </button>
        {aspectLabel&&(<><div style={tbSep}/><span style={{ fontSize:'0.68rem',fontWeight:'700',color:'#6B7280',whiteSpace:'nowrap',userSelect:'none' }}>{aspectLabel}</span>{imgDims&&<span style={{ fontSize:'0.6rem',color:'#9CA3AF',whiteSpace:'nowrap',userSelect:'none' }}>{imgDims.w}×{imgDims.h}</span>}</>)}
        <div style={tbSep}/>
        {/* Text active toggle */}
        <button onClick={()=>setActiveTool(activeTool==='text'?'select':'text')} style={tgl(activeTool==='text')} title="Texto"><Type size={14}/></button>
        <div style={tbSep}/>
        {/* Font */}
        <select value={fontFamily} onChange={e=>setFontFamily(e.target.value)}
          style={{ height:28,padding:'0 5px',border:'1px solid #E5E7EB',borderRadius:6,fontSize:'0.7rem',backgroundColor:'#fff',cursor:'pointer',color:'#374151',outline:'none',flexShrink:0,fontFamily,maxWidth:100 }}>
          {FONT_FAMILIES.map(f=><option key={f} value={f} style={{ fontFamily:f }}>{f}</option>)}
        </select>
        {/* Size */}
        <button onClick={()=>setFontSize(Math.max(8,fontSize-2))} style={{ ...tbBtn,width:22,height:26 }}>−</button>
        <input type="number" value={fontSize} min={8} max={200}
          onChange={e=>setFontSize(Math.max(8,Math.min(200,Number(e.target.value))))}
          style={{ width:40,height:26,padding:'0 3px',border:'1px solid #E5E7EB',borderRadius:6,fontSize:'0.7rem',fontWeight:'700',textAlign:'center',color:'#374151',outline:'none',flexShrink:0 }}/>
        <button onClick={()=>setFontSize(Math.min(200,fontSize+2))} style={{ ...tbBtn,width:22,height:26 }}>+</button>
        <div style={tbSep}/>
        <button onClick={()=>setFontBold(!fontBold)}      style={tgl(fontBold)}><Bold size={13}/></button>
        <button onClick={()=>setFontItalic(!fontItalic)}  style={tgl(fontItalic)}><Italic size={13}/></button>
        <button onClick={()=>setFontUnderline(!fontUnderline)} style={tgl(fontUnderline)}><Underline size={13}/></button>
        <div style={tbSep}/>
        <button onClick={()=>setTextAlign('left')}   style={tgl(textAlign==='left')}><AlignLeft size={13}/></button>
        <button onClick={()=>setTextAlign('center')} style={tgl(textAlign==='center')}><AlignCenter size={13}/></button>
        <button onClick={()=>setTextAlign('right')}  style={tgl(textAlign==='right')}><AlignRight size={13}/></button>
        <div style={tbSep}/>
        <label style={{ position:'relative',cursor:'pointer',flexShrink:0 }}>
          <div style={{ width:26,height:26,borderRadius:6,border:'1.5px solid #E5E7EB',backgroundColor:textColor,cursor:'pointer' }}/>
          <input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)}
            style={{ position:'absolute',inset:0,opacity:0,width:'100%',height:'100%',cursor:'pointer' }}/>
        </label>

        {/* ── Action buttons: undo / clear / delete ── */}
        <div style={{ flex:1 }}/>
        <div style={tbSep}/>
        <button onClick={onUndo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"
          style={{ ...tbBtn, color:canUndo?'#374151':'#D1D5DB', border:`1px solid ${canUndo?'#E5E7EB':'#F3F4F6'}` }}>
          <Undo2 size={14}/>
        </button>
        <button onClick={onClear} title="Limpiar área"
          style={{ ...tbBtn, color:'#6B7280' }}>
          <Trash2 size={14}/>
        </button>
        <button onClick={onDelete} disabled={!hasSelected} title="Eliminar seleccionado (Supr)"
          style={{ ...tbBtn, backgroundColor:hasSelected?'#FEF2F2':'#fff', color:hasSelected?'#EF4444':'#D1D5DB', border:`1px solid ${hasSelected?'#FECACA':'#F3F4F6'}` }}>
          <X size={14}/>
        </button>
      </div>

      {/* ── CONTENT: slot strip + canvas ── */}
      <div ref={contentRef} style={{ flex:1,display:'flex',overflow:'hidden',backgroundColor:'#C2C2C2' }}>
        <SlotStrip slots={slots} activeSlot={activeSlot} slotSize={slotSize} onSlotClick={onSlotClick}/>

        {/* Canvas */}
        <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative' }}>
          <div
            ref={frameRef}
            onClick={onFrameClick}
            onMouseMove={onFrameMove}
            onMouseUp={onFrameUp}
            onMouseLeave={onFrameUp}
            style={{ width:frameW,height:frameH,flexShrink:0,position:'relative',backgroundColor:bgColor||'#fff',backgroundImage:bgColor?'none':'repeating-conic-gradient(#D1D5DB 0% 25%,transparent 0% 50%)',backgroundSize:'20px 20px',borderRadius:tpl.shape==='circle'?'50%':4,boxShadow:'0 4px 24px rgba(0,0,0,0.22)',overflow:'hidden',cursor:cursorMap[activeTool] }}>

            {/* Dim label */}
            <div style={{ position:'absolute',bottom:5,right:7,fontSize:'0.5rem',fontWeight:'700',color:'rgba(0,0,0,0.2)',pointerEvents:'none',userSelect:'none',zIndex:2 }}>{tpl.desc}</div>

            {/* Image layer */}
            {imageSrc&&(
              <div onMouseDown={onImageMouseDown}
                style={{ position:'absolute',left:'50%',top:'50%',transform:`translate(calc(-50% + ${imagePos.x}px),calc(-50% + ${imagePos.y}px))`,cursor:activeTool==='select'?'move':'default',zIndex:3,userSelect:'none',touchAction:'none' }}>
                <div style={{ transform:`scale(${zoom/100})`,transformOrigin:'center',transition:'transform 0.12s' }}>
                  <img src={imageSrc} alt="editor"
                    onLoad={e=>{const im=e.currentTarget;onLoad(im.naturalWidth,im.naturalHeight);}}
                    draggable={false}
                    style={{ maxWidth:frameW,maxHeight:frameH,display:'block',transform:imgTransform,filter:buildFilter(adj),outline:selectedId==='image'&&activeTool==='select'?'2px solid #FF6835':'none',outlineOffset:'2px' }}/>
                </div>
              </div>
            )}

            {/* Text items */}
            {textItems.map(item=>{
              const isSelected=selectedId===item.id;
              const scaledFontSize=Math.max(8,item.fontSize*frameH/800);
              return (
                <div key={item.id}
                  onMouseDown={e=>onTextMouseDown(e,item)}
                  style={{ position:'absolute',left:`${item.x}%`,top:`${item.y}%`,transform:`translate(-50%,-50%) rotate(${item.rotation}deg)`,cursor:activeTool==='select'?'move':activeTool==='text'?'text':'default',userSelect:'none',zIndex:10,padding:4,borderRadius:3,outline:isSelected?'1.5px dashed #FF6835':'none',touchAction:'none' }}>
                  <span
                    contentEditable={activeTool==='text'&&isSelected}
                    suppressContentEditableWarning
                    onBlur={e=>{
                      const content=e.currentTarget.textContent?.trim()||'Texto';
                      setTextItems(prev=>prev.map(t=>t.id===item.id?{...t,content}:t));
                    }}
                    style={{ fontFamily:item.fontFamily,fontSize:scaledFontSize,fontWeight:item.bold?'700':'400',fontStyle:item.italic?'italic':'normal',textDecoration:item.underline?'underline':'none',color:item.color,textAlign:item.align,whiteSpace:'nowrap',opacity:item.opacity/100,display:'block',outline:'none',textShadow:'0 1px 4px rgba(0,0,0,0.12)' }}>
                    {item.content}
                  </span>
                  {/* Controls when selected */}
                  {isSelected&&activeTool==='select'&&(
                    <button onClick={e=>{e.stopPropagation();setTextItems(prev=>prev.filter(t=>t.id!==item.id));setSelectedId(null);}}
                      style={{ position:'absolute',top:-10,right:-10,width:18,height:18,borderRadius:'50%',border:'none',backgroundColor:'#EF4444',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:20 }}>
                      <X size={10}/>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Processing */}
            {processing&&(
              <div style={{ position:'absolute',inset:0,backgroundColor:'rgba(79,70,229,0.1)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,zIndex:30 }}>
                <Loader size={28} color="#4F46E5" style={{ animation:'spin 0.8s linear infinite' }}/>
                <span style={{ fontSize:'0.78rem',fontWeight:'700',color:'#4F46E5',backgroundColor:'rgba(255,255,255,0.9)',padding:'4px 12px',borderRadius:20 }}>Quitando fondo...</span>
              </div>
            )}
          </div>

          {/* Empty state */}
          {!imageSrc&&!processing&&(
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none',gap:6 }}>
              <div style={{ fontSize:'3rem' }}>🖼️</div>
              <p style={{ fontSize:'0.85rem',fontWeight:'700',color:'#fff',margin:0,textShadow:'0 1px 4px rgba(0,0,0,0.3)' }}>Sin imagen</p>
              <p style={{ fontSize:'0.72rem',color:'rgba(255,255,255,0.8)',margin:0 }}>Cargá o arrastrá aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════ PROPERTIES PANEL ══════════ */
function PropertiesPanel({
  imageSrc, adj, rotation, flipH, flipV, imgDims,
  onExport, selectedTemplate, setSelectedTemplate,
  textItems, setTextItems, selectedId,
}: {
  imageSrc: string|null; adj: Adjustments; rotation: number;
  flipH: boolean; flipV: boolean; imgDims: {w:number;h:number}|null;
  onExport: ()=>void;
  selectedTemplate: string; setSelectedTemplate: (id:string)=>void;
  textItems: TextItem[]; setTextItems: React.Dispatch<React.SetStateAction<TextItem[]>>;
  selectedId: string|null;
}) {
  const active=Object.entries(adj).filter(([k,v])=>v!==(DEFAULT_ADJ as any)[k]).length;
  const selText=textItems.find(t=>t.id===selectedId);
  const updText=(patch:Partial<TextItem>)=>setTextItems(prev=>prev.map(t=>t.id===selText!.id?{...t,...patch}:t));

  return (
    <div>
      {imgDims&&(
        <><p style={pLbl}>Dimensiones</p>
        <p style={{ fontSize:'0.78rem',fontWeight:'700',color:'#111827',margin:'0 0 2px' }}>{imgDims.w} × {imgDims.h} px</p>
        <p style={{ fontSize:'0.68rem',color:'#9CA3AF',margin:'0 0 10px' }}>{aspectStr(imgDims.w,imgDims.h)}</p></>
      )}

      <p style={pLbl}>Estado actual</p>
      <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:12 }}>
        {rotation>0&&<Chip c="#FF6835">↻ {rotation}°</Chip>}
        {flipH&&<Chip c="#3B82F6">↔ H</Chip>}
        {flipV&&<Chip c="#3B82F6">↕ V</Chip>}
        {active>0&&<Chip c="#10B981">✓ {active} aj.</Chip>}
        {!rotation&&!flipH&&!flipV&&active===0&&<span style={{ fontSize:'0.7rem',color:'#9CA3AF' }}>Sin modificaciones</span>}
      </div>

      {/* Text item editor */}
      {selText&&(
        <div style={{ marginBottom:16,padding:10,borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#FAFAFA' }}>
          <p style={{ ...pLbl,marginBottom:6 }}>Texto seleccionado</p>
          <textarea value={selText.content} rows={2}
            onChange={e=>updText({content:e.target.value})}
            style={{ width:'100%',padding:'6px 8px',border:'1px solid #E5E7EB',borderRadius:6,fontSize:'0.72rem',resize:'vertical',outline:'none',boxSizing:'border-box',marginBottom:8 }}/>

          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {/* Opacity */}
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                <label style={{ fontSize:'0.62rem',fontWeight:'600',color:'#6B7280' }}>Opacidad</label>
                <span style={{ fontSize:'0.62rem',color:'#9CA3AF' }}>{selText.opacity}%</span>
              </div>
              <input type="range" min={10} max={100} value={selText.opacity}
                onChange={e=>updText({opacity:Number(e.target.value)})}
                style={{ width:'100%',accentColor:'#FF6835',height:3 }}/>
            </div>
            {/* Rotation */}
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                <label style={{ fontSize:'0.62rem',fontWeight:'600',color:'#6B7280' }}>Rotación</label>
                <span style={{ fontSize:'0.62rem',color:'#9CA3AF' }}>{selText.rotation}°</span>
              </div>
              <input type="range" min={-180} max={180} value={selText.rotation}
                onChange={e=>updText({rotation:Number(e.target.value)})}
                style={{ width:'100%',accentColor:'#FF6835',height:3 }}/>
            </div>
          </div>

          {/* Font size */}
          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
              <label style={{ fontSize:'0.62rem',fontWeight:'600',color:'#6B7280' }}>Tamaño</label>
              <span style={{ fontSize:'0.62rem',color:'#9CA3AF' }}>{selText.fontSize}px</span>
            </div>
            <input type="range" min={8} max={200} value={selText.fontSize}
              onChange={e=>updText({fontSize:Number(e.target.value)})}
              style={{ width:'100%',accentColor:'#FF6835',height:3 }}/>
          </div>

          {/* Color */}
          <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:8 }}>
            <label style={{ fontSize:'0.62rem',fontWeight:'600',color:'#6B7280' }}>Color</label>
            <label style={{ position:'relative',cursor:'pointer' }}>
              <div style={{ width:22,height:22,borderRadius:4,border:'1px solid #E5E7EB',backgroundColor:selText.color }}/>
              <input type="color" value={selText.color.startsWith('rgba')?'#ffffff':selText.color}
                onChange={e=>updText({color:e.target.value})}
                style={{ position:'absolute',inset:0,opacity:0,width:'100%',height:'100%',cursor:'pointer' }}/>
            </label>
            {/* Style toggles */}
            <div style={{ display:'flex',gap:4,marginLeft:'auto' }}>
              <button onClick={()=>updText({bold:!selText.bold})}
                style={{ ...tbBtn,width:24,height:24,backgroundColor:selText.bold?'#FFF4F0':'#fff',color:selText.bold?'#FF6835':'#374151',border:`1px solid ${selText.bold?'#FFD4C2':'#E5E7EB'}` }}><Bold size={11}/></button>
              <button onClick={()=>updText({italic:!selText.italic})}
                style={{ ...tbBtn,width:24,height:24,backgroundColor:selText.italic?'#FFF4F0':'#fff',color:selText.italic?'#FF6835':'#374151',border:`1px solid ${selText.italic?'#FFD4C2':'#E5E7EB'}` }}><Italic size={11}/></button>
            </div>
          </div>
        </div>
      )}

      <button onClick={()=>imageSrc&&onExport()} disabled={!imageSrc}
        style={{ width:'100%',padding:'9px',borderRadius:8,border:'none',backgroundColor:imageSrc?'#FF6835':'#E5E7EB',color:imageSrc?'#fff':'#9CA3AF',cursor:imageSrc?'pointer':'not-allowed',fontSize:'0.78rem',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginBottom:16 }}>
        <Download size={13}/> Exportar
      </button>

      {/* Templates */}
      <p style={pLbl}>Templates</p>
      <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
        {CANVAS_TEMPLATES.map(t=>{
          const isActive=selectedTemplate===t.id;
          const ratio=t.w/t.h; const bH=Math.min(24,Math.round(32/ratio)); const bW=Math.round(bH*ratio);
          return (
            <button key={t.id} onClick={()=>setSelectedTemplate(t.id)}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:7,border:`1.5px solid ${isActive?'#FF6835':'#E5E7EB'}`,backgroundColor:isActive?'#FFF4F0':'#fff',cursor:'pointer' }}>
              <div style={{ width:36,height:26,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <div style={{ width:bW,height:bH,border:`1.5px solid ${isActive?'#FF6835':'#9CA3AF'}`,borderRadius:t.shape==='circle'?'50%':2,backgroundColor:isActive?'#FECDD3':'#F3F4F6' }}/>
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:'0.72rem',fontWeight:'700',color:isActive?'#FF6835':'#111827' }}>{t.name}</div>
                <div style={{ fontSize:'0.6rem',color:'#9CA3AF' }}>{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════ EXPORT DIALOG ══════════ */
function ExportDialog({ slots,onClose,onExportSelected }:{slots:(SlotState|null)[];onClose:()=>void;onExportSelected:(i:number[])=>void}) {
  const filled=slots.map((s,i)=>({s,i})).filter(({s})=>s!==null);
  const [checked,setChecked]=useState<boolean[]>(slots.map((s,i)=>i<=1&&s!==null));
  const toggle=(i:number)=>setChecked(prev=>prev.map((v,j)=>j===i?!v:v));
  const selected=checked.map((v,i)=>v?i:-1).filter(i=>i>=0);
  return (
    <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9000 }}>
      <div style={{ backgroundColor:'#fff',borderRadius:14,padding:24,width:340,boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
          <h3 style={{ margin:0,fontSize:'0.95rem',fontWeight:'800' }}>¿Qué exportar?</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#9CA3AF' }}><X size={16}/></button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:20 }}>
          {filled.map(({s,i})=>s?(
            <label key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:`1.5px solid ${checked[i]?'#FF6835':'#E5E7EB'}`,backgroundColor:checked[i]?'#FFF4F0':'#fff',cursor:'pointer' }}>
              <input type="checkbox" checked={checked[i]} onChange={()=>toggle(i)} style={{ display:'none' }}/>
              {checked[i]?<CheckSquare size={15} color="#FF6835"/>:<Square size={15} color="#9CA3AF"/>}
              <img src={s.src} alt="" style={{ width:36,height:36,objectFit:'contain',borderRadius:4,border:'1px solid #F3F4F6' }}/>
              <span style={{ fontSize:'0.78rem',fontWeight:'700',color:'#374151' }}>{SLOT_LABELS[i]}</span>
            </label>
          ):null)}
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={onClose} style={{ flex:1,padding:'9px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#fff',color:'#374151',cursor:'pointer',fontSize:'0.78rem',fontWeight:'600' }}>Cancelar</button>
          <button onClick={()=>{onExportSelected(selected);onClose();}} disabled={selected.length===0}
            style={{ flex:2,padding:'9px',borderRadius:8,border:'none',backgroundColor:selected.length>0?'#FF6835':'#E5E7EB',color:selected.length>0?'#fff':'#9CA3AF',cursor:selected.length>0?'pointer':'not-allowed',fontSize:'0.78rem',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
            <Download size={13}/> Exportar {selected.length>0?`(${selected.length})`:''}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════ TOKENS ══════════ */
const Chip=({children,c}:{children:React.ReactNode;c:string})=>(
  <span style={{ padding:'2px 7px',borderRadius:4,backgroundColor:`${c}18`,color:c,fontSize:'0.65rem',fontWeight:'700' }}>{children}</span>
);
const sLbl:React.CSSProperties={ fontSize:'0.6rem',fontWeight:'800',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 5px' };
const pLbl:React.CSSProperties={ fontSize:'0.6rem',fontWeight:'800',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 5px' };
const tbBtn:React.CSSProperties={ width:28,height:28,borderRadius:6,border:'1px solid #E5E7EB',backgroundColor:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#374151',flexShrink:0 };
const tbVal:React.CSSProperties={ fontSize:'0.72rem',fontWeight:'700',color:'#374151',minWidth:34,textAlign:'center',userSelect:'none',flexShrink:0 };
const tbSep:React.CSSProperties={ width:1,height:20,backgroundColor:'#E5E7EB',margin:'0 2px',flexShrink:0 };

/* ══════════ MAIN ══════════ */
export function EditorImagenesWorkspace({ onNavigate }: Props) {
  const [imageSrc,setImageSrc]     = useState<string|null>(null);
  const [imageName,setImageName]   = useState('imagen');
  const [adj,setAdj]               = useState<Adjustments>(DEFAULT_ADJ);
  const [presetName,setPresetName] = useState('Original');
  const [rotation,setRotation]     = useState(0);
  const [flipH,setFlipH]           = useState(false);
  const [flipV,setFlipV]           = useState(false);
  const [zoom,setZoom]             = useState(100);
  const [imgDims,setImgDims]       = useState<{w:number;h:number}|null>(null);
  const [slots,setSlots]           = useState<(SlotState|null)[]>(Array(6).fill(null));
  const [activeSlot,setActiveSlot] = useState(-1);
  const [processing,setProcessing] = useState(false);
  const [bgTolerance,setBgTolerance]= useState(58);
  const [bgColor,setBgColor]       = useState('');
  const [selectedTemplate,setSelectedTemplate]= useState('square');
  const [showExportDialog,setShowExportDialog]= useState(false);
  const [activeTool,setActiveTool] = useState<ToolId>('select');
  const [selectedId,setSelectedId] = useState<string|null>(null);
  const [imagePos,setImagePos]     = useState({x:0,y:0});
  const [textItems,setTextItems]   = useState<TextItem[]>([]);

  const [fontFamily,setFontFamily]       = useState('Arial');
  const [fontSize,setFontSize]           = useState(72);
  const [fontBold,setFontBold]           = useState(false);
  const [fontItalic,setFontItalic]       = useState(false);
  const [fontUnderline,setFontUnderline] = useState(false);
  const [textAlign,setTextAlign]         = useState<'left'|'center'|'right'>('center');
  const [textColor,setTextColor]         = useState('#ffffff');

  // Undo (stores snapshots of textItems + imagePos)
  const undoStack = useRef<{ textItems: TextItem[]; imagePos: {x:number;y:number} }[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const fileRef=useRef<HTMLInputElement>(null);

  const handleFileLoad=(file:File)=>{
    const reader=new FileReader();
    reader.onload=async e=>{
      const src=e.target?.result as string;
      setImageSrc(src); setImageName(file.name.replace(/\.[^.]+$/,''));
      setAdj(DEFAULT_ADJ); setPresetName('Original');
      setRotation(0); setFlipH(false); setFlipV(false); setZoom(100);
      setImagePos({x:0,y:0}); setTextItems([]);
      const newSlots:(SlotState|null)[]=Array(6).fill(null);
      newSlots[0]={src,adj:DEFAULT_ADJ,rotation:0,flipH:false,flipV:false,label:'Original'};
      setSlots(newSlots); setActiveSlot(0);
      setProcessing(true);
      setTimeout(async()=>{
        try {
          const bgRemoved=await removeBg(src,bgTolerance);
          const aa=await autoAdjust(bgRemoved);
          setSlots(prev=>{ const next=[...prev]; next[1]={src:bgRemoved,adj:aa,rotation:0,flipH:false,flipV:false,label:'Auto'}; return next; });
          setImageSrc(bgRemoved); setAdj(aa); setPresetName(''); setActiveSlot(1);
        } catch { /**/ }
        finally { setProcessing(false); }
      },60);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop=useCallback((e:React.DragEvent)=>{
    e.preventDefault();
    const file=e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFileLoad(file);
  },[bgTolerance]);

  const handleRemoveBg=()=>{
    if (!imageSrc||processing) return;
    setProcessing(true);
    setTimeout(async()=>{
      try { setImageSrc(await removeBg(imageSrc,bgTolerance)); }
      catch { /**/ }
      finally { setProcessing(false); }
    },60);
  };

  const handleSlotClick=(i:number)=>{
    const s=slots[i];
    if (!s) {
      if (!imageSrc) return;
      setSlots(prev=>{ const next=[...prev]; next[i]={src:imageSrc,adj,rotation,flipH,flipV,label:SLOT_LABELS[i]}; return next; });
      setActiveSlot(i);
    } else {
      setImageSrc(s.src); setAdj(s.adj); setPresetName('');
      setRotation(s.rotation); setFlipH(s.flipH); setFlipV(s.flipV); setActiveSlot(i);
    }
  };

  // Save snapshot before destructive actions
  const snapshot = useCallback((items: TextItem[], pos: {x:number;y:number}) => {
    undoStack.current = [...undoStack.current.slice(-9), { textItems: items, imagePos: pos }];
    setCanUndo(true);
  }, []);

  const handleUndo = () => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setTextItems(prev.textItems);
    setImagePos(prev.imagePos);
    setSelectedId(null);
    setCanUndo(undoStack.current.length > 0);
  };

  const handleClear = () => {
    snapshot(textItems, imagePos);
    setTextItems([]);
    setImagePos({x:0,y:0});
    setSelectedId(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    snapshot(textItems, imagePos);
    if (selectedId === 'image') {
      // deselect image (don't remove it, just deselect)
      setSelectedId(null);
    } else {
      setTextItems(prev => prev.filter(t => t.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Keyboard: Delete / Backspace removes selected element
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && selectedId !== 'image') {
          setTextItems(prev => prev.filter(t => t.id !== selectedId));
          setSelectedId(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, textItems, imagePos]);

  const doExport=(s:SlotState,fname:string)=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
      const ctx=c.getContext('2d')!; ctx.filter=buildFilter(s.adj);
      const cx=c.width/2,cy=c.height/2;
      ctx.translate(cx,cy); ctx.rotate(s.rotation*Math.PI/180);
      ctx.scale(s.flipH?-1:1,s.flipV?-1:1); ctx.drawImage(img,-cx,-cy);
      const url=c.toDataURL('image/png');
      const a=document.createElement('a'); a.href=url; a.download=`${fname}.png`; a.click();
    };
    img.src=s.src;
  };

  const handleExportSelected=(indices:number[])=>
    indices.forEach(i=>{ const s=slots[i]; if(s) doExport(s,`${imageName}_${SLOT_LABELS[i].toLowerCase()}`); });

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFileLoad(f); }}/>
      {showExportDialog&&<ExportDialog slots={slots} onClose={()=>setShowExportDialog(false)} onExportSelected={handleExportSelected}/>}

      <WorkspaceShell
        toolId="editor-imagenes" onNavigate={onNavigate}
        leftPanel={
          <LeftPanel adj={adj} setAdj={setAdj} presetName={presetName} setPresetName={setPresetName}
            onUpload={()=>fileRef.current?.click()}
            onRemoveBg={handleRemoveBg} processing={processing} hasImage={!!imageSrc}
            bgTolerance={bgTolerance} setBgTolerance={setBgTolerance}
            bgColor={bgColor} setBgColor={setBgColor}
            activeTool={activeTool} setActiveTool={setActiveTool}
          />
        }
        canvas={
          <div style={{ height:'100%' }} onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
            <CanvasArea
              imageSrc={imageSrc} adj={adj}
              rotation={rotation} setRotation={setRotation}
              flipH={flipH} setFlipH={setFlipH} flipV={flipV} setFlipV={setFlipV}
              zoom={zoom} onZoom={setZoom}
              onLoad={(w,h)=>setImgDims({w,h})} imgDims={imgDims}
              slots={slots} activeSlot={activeSlot} onSlotClick={handleSlotClick}
              selectedTemplate={selectedTemplate} processing={processing} bgColor={bgColor}
              activeTool={activeTool} setActiveTool={setActiveTool}
              selectedId={selectedId} setSelectedId={setSelectedId}
              imagePos={imagePos} setImagePos={setImagePos}
              textItems={textItems} setTextItems={setTextItems}
              fontFamily={fontFamily} setFontFamily={setFontFamily}
              fontSize={fontSize} setFontSize={setFontSize}
              fontBold={fontBold} setFontBold={setFontBold}
              fontItalic={fontItalic} setFontItalic={setFontItalic}
              fontUnderline={fontUnderline} setFontUnderline={setFontUnderline}
              textAlign={textAlign} setTextAlign={setTextAlign}
              textColor={textColor} setTextColor={setTextColor}
              onUndo={handleUndo} onClear={handleClear} onDelete={handleDelete}
              canUndo={canUndo} hasSelected={!!selectedId}
            />
          </div>
        }
        properties={
          <PropertiesPanel
            imageSrc={imageSrc} adj={adj} rotation={rotation}
            flipH={flipH} flipV={flipV} imgDims={imgDims}
            onExport={()=>setShowExportDialog(true)}
            selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
            textItems={textItems} setTextItems={setTextItems} selectedId={selectedId}
          />
        }
        actions={imageSrc?(
          <>
            <span style={{ fontSize:'0.68rem',color:'#71717A' }}>{imageName}</span>
            <button onClick={()=>setShowExportDialog(true)}
              style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:5,border:'none',backgroundColor:'#FF6835',color:'#fff',cursor:'pointer',fontSize:'0.72rem',fontWeight:'700' }}>
              <Download size={12}/> Exportar
            </button>
          </>
        ):undefined}
      />
    </>
  );
}
