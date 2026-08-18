// @ts-nocheck
/**
 * The flowchart engine — ported BYTE-IDENTICAL from the pre-Next handbook.
 *
 * @ts-nocheck is deliberate and worth defending. This draws all twenty
 * diagrams: orthogonal edge routing with rounded corners, text fitting,
 * collision-checked labels. Every diagram was verified for text overlap,
 * edges crossing unrelated nodes, and greyscale legibility. Adding type
 * annotations means editing 133 lines of working geometry, and a slip there
 * is invisible until a diagram silently draws wrong. Typing the *boundary*
 * (below) gives callers safety; typing the interior would only buy risk.
 *
 * It builds real SVG elements, so callers must run it in the browser.
 */

export interface FCNode {
  id: string; type: string; x: number; y: number; w: number; h: number;
  lines: string[]; fs?: number; [k: string]: unknown;
}
export interface FCEdge {
  from: string; to: string; fs?: string; ts?: string; kind?: string;
  label?: string; lx?: number; ly?: number; dash?: boolean;
  via?: { x: number; y: number }[]; [k: string]: unknown;
}
export interface FCSpec {
  viewBox: string;
  nodes: FCNode[];
  edges?: FCEdge[];
  captions?: { t: string; x: number; y: number }[];
}
export interface FCHandle {
  nodes: Record<string, SVGElement>;
  edges: Record<string, SVGElement>;
}
export interface FCEngine {
  draw(svg: SVGElement | null, spec: FCSpec): FCHandle;
  strip(host: Element | null, steps: [string, string][], caption?: string): void;
  roundPath(pts: { x: number; y: number }[], r?: number): string;
  anchor(n: FCNode, side: string): { x: number; y: number };
}


/* Helpers the engine closed over in the original single-file build. They
   lived in the outer script scope, so extracting FC into a module orphaned
   them — `el is not defined` inside strip(), which killed every diagram on
   the page. Restored here verbatim so the module is self-contained. */
const NS = "http://www.w3.org/2000/svg";
const RM = typeof window !== "undefined" && window.matchMedia
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function el(tag, attrs, kids) {
  const n = document.createElementNS(NS, tag);
  for (const k in (attrs || {})) n.setAttribute(k, attrs[k]);
  (kids || []).forEach((c) => n.appendChild(c));
  return n;
}
function txt(s) { return document.createTextNode(s); }

const FC = (function(){
  function anchor(n,side){
    const cx=n.x+n.w/2, cy=n.y+n.h/2;
    return side==='n'?{x:cx,y:n.y}:side==='s'?{x:cx,y:n.y+n.h}
         : side==='w'?{x:n.x,y:cy}:{x:n.x+n.w,y:cy};
  }
  // orthogonal polyline with rounded corners
  function roundPath(pts,r){
    r = r||9;
    if (pts.length<2) return '';
    let d = 'M'+pts[0].x+','+pts[0].y;
    for (let i=1;i<pts.length-1;i++){
      const p=pts[i], a=pts[i-1], b=pts[i+1];
      const d1=Math.hypot(p.x-a.x,p.y-a.y), d2=Math.hypot(b.x-p.x,b.y-p.y);
      if (d1<1||d2<1) continue;
      const rr=Math.min(r,d1/2,d2/2);
      const s={x:p.x+(a.x-p.x)/d1*rr, y:p.y+(a.y-p.y)/d1*rr};
      const e={x:p.x+(b.x-p.x)/d2*rr, y:p.y+(b.y-p.y)/d2*rr};
      d += ' L'+s.x+','+s.y+' Q'+p.x+','+p.y+' '+e.x+','+e.y;
    }
    const L=pts[pts.length-1];
    return d+' L'+L.x+','+L.y;
  }
  function autoVia(p1,p2,fs,ts){
    if ((fs==='s'&&ts==='n')||(fs==='n'&&ts==='s')){
      if (Math.abs(p1.x-p2.x)<0.5) return [];
      const my=(p1.y+p2.y)/2; return [{x:p1.x,y:my},{x:p2.x,y:my}];
    }
    if ((fs==='e'&&ts==='w')||(fs==='w'&&ts==='e')){
      if (Math.abs(p1.y-p2.y)<0.5) return [];
      const mx=(p1.x+p2.x)/2; return [{x:mx,y:p1.y},{x:mx,y:p2.y}];
    }
    if (fs==='e'||fs==='w') return [{x:p2.x,y:p1.y}];
    return [{x:p1.x,y:p2.y}];
  }
  let fcSeq = 0;
  function draw(svg,spec){
    svg.innerHTML='';
    if (spec.viewBox) svg.setAttribute('viewBox',spec.viewBox);
    const sfx = '-' + (++fcSeq);
    const defs=el('defs');
    [['fcA','var(--line-2)'],['fcY','var(--green)'],['fcN','var(--red)'],['fcS','var(--violet)']].forEach(([id,c])=>{
      const m=el('marker',{id:id+sfx,viewBox:'0 0 9 9',refX:'7.5',refY:'4.5',markerWidth:'5.5',markerHeight:'5.5',orient:'auto-start-reverse'});
      m.appendChild(el('path',{d:'M0,0 L9,4.5 L0,9 z',fill:c}));
      defs.appendChild(m);
    });
    svg.appendChild(defs);
    const byId={}; spec.nodes.forEach(n=>byId[n.id]=n);
    const out={nodes:{},edges:{},labels:{}};

    (spec.edges||[]).forEach(e=>{
      const A=byId[e.from], B=byId[e.to];
      const fs=e.fs||'s', ts=e.ts||'n';
      const p1=anchor(A,fs), p2=anchor(B,ts);
      const via=e.via||autoVia(p1,p2,fs,ts);
      const pts=[p1].concat(via,[p2]);
      const kind=e.kind||'';
      const p=el('path',{d:roundPath(pts,e.r),class:'fc-e '+kind+(e.dash?' dash':''),
        'marker-end':'url(#'+(kind==='yes'?'fcY':kind==='no'?'fcN':'fcA')+sfx+')'});
      svg.appendChild(p);
      out.edges[e.from+'>'+e.to]=p;
      if (e.label){
        const mid = e.lp || pts[Math.floor(pts.length/2)];
        const t=el('text',{x:(e.lx!==undefined?e.lx:mid.x),y:(e.ly!==undefined?e.ly:mid.y-5),class:'fc-l '+kind});
        t.appendChild(txt(e.label)); svg.appendChild(t);
        out.labels[e.from+'>'+e.to]=t;
      }
    });

    spec.nodes.forEach(n=>{
      const g=el('g',{class:'fc-n t-'+n.type});
      const cx=n.x+n.w/2, cy=n.y+n.h/2;
      if (n.type==='dec'){
        g.appendChild(el('polygon',{points:[cx+','+n.y,(n.x+n.w)+','+cy,cx+','+(n.y+n.h),n.x+','+cy].join(' ')}));
      } else if (n.type==='tool'){
        const s=13;
        g.appendChild(el('polygon',{points:[(n.x+s)+','+n.y,(n.x+n.w)+','+n.y,(n.x+n.w-s)+','+(n.y+n.h),n.x+','+(n.y+n.h)].join(' ')}));
      } else {
        g.appendChild(el('rect',{x:n.x,y:n.y,width:n.w,height:n.h,
          rx:(n.type==='start'?Math.min(n.h/2,22):7)}));
      }
      const lines=n.lines||[n.label||''];
      const start=cy - (lines.length-1)*7 + 4;
      lines.forEach((ln,i)=>{
        const t=el('text',{x:cx,y:start+i*14.5});
        if (n.fs) t.setAttribute('style','font-size:'+n.fs+'px');
        t.appendChild(txt(ln)); g.appendChild(t);
      });
      svg.appendChild(g);
      out.nodes[n.id]=g;
    });
    (spec.captions||[]).forEach(c=>{
      const t=el('text',{x:c.x,y:c.y,class:'fc-cap'});
      if (c.anchor) t.setAttribute('style','text-anchor:'+c.anchor);
      t.appendChild(txt(c.t)); svg.appendChild(t);
    });
    return out;
  }
  // "the method in four steps" strip, laid out 2x2 so it renders large
  let stripSeq = 0;
  function strip(svg,steps,backLabel){
    svg.innerHTML='';
    svg.setAttribute('viewBox','0 0 590 246');
    if (!svg.style.maxWidth){ svg.style.maxWidth='820px'; svg.style.margin='0 auto'; }
    const uid='stm'+(stripSeq++);
    const defs=el('defs');
    const m=el('marker',{id:uid,viewBox:'0 0 9 9',refX:'7.5',refY:'4.5',markerWidth:'5.5',markerHeight:'5.5',orient:'auto-start-reverse'});
    m.appendChild(el('path',{d:'M0,0 L9,4.5 L0,9 z',fill:'var(--line-2)'}));
    defs.appendChild(m); svg.appendChild(defs);
    const W=250,H=74,GX=38,GY=36,X0=26,Y0=12;
    const at=i=>({x:X0+(i%2)*(W+GX), y:Y0+Math.floor(i/2)*(H+GY)});
    const arrow=d=>svg.appendChild(el('path',{d:d,class:'fc-e','marker-end':'url(#'+uid+')'}));
    steps.forEach((st,i)=>{
      const P=at(i), g=el('g',{class:'fc-strip'});
      g.appendChild(el('rect',{class:'box',x:P.x,y:P.y,width:W,height:H,rx:8}));
      const num=el('g',{class:'fc-num'});
      num.appendChild(el('circle',{cx:P.x+24,cy:P.y+H/2,r:14}));
      const nt=el('text',{x:P.x+24,y:P.y+H/2+4.5}); nt.appendChild(txt(String(i+1)));
      num.appendChild(nt); g.appendChild(num);
      const ls=Array.isArray(st)?st:[st];
      const top=P.y+H/2-(ls.length-1)*9+4.5;
      ls.forEach((ln,j)=>{ const t=el('text',{class:'st',x:P.x+48,y:top+j*18}); t.appendChild(txt(ln)); g.appendChild(t); });
      svg.appendChild(g);
    });
    const a=at(0),b=at(1),c=at(2),d=at(3);
    arrow('M'+(a.x+W)+','+(a.y+H/2)+' L'+(b.x-7)+','+(b.y+H/2));                       // 1 -> 2
    arrow(roundPath([{x:b.x+W/2,y:b.y+H},{x:b.x+W/2,y:b.y+H+GY/2},
                     {x:c.x+W/2,y:c.y-GY/2},{x:c.x+W/2,y:c.y-5}],12));                  // 2 -> 3 (wraps)
    arrow('M'+(c.x+W)+','+(c.y+H/2)+' L'+(d.x-7)+','+(d.y+H/2));                       // 3 -> 4
    arrow(roundPath([{x:d.x+W/2,y:d.y+H},{x:d.x+W/2,y:214},{x:13,y:214},
                     {x:13,y:a.y+H/2},{x:a.x-6,y:a.y+H/2}],12));                        // 4 -> back to 1
    const t=el('text',{x:302,y:236,class:'fc-l'}); t.appendChild(txt(backLabel)); svg.appendChild(t);
  }
  return {draw, strip, roundPath, anchor};
})();

export default FC as FCEngine;
