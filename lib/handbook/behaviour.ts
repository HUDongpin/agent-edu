// @ts-nocheck
/* The handbook's interactive behaviour: 22 widget modules, verbatim.
   Exported as one init() the React component calls after mount. The flowchart
   engine is injected rather than redefined, so both halves share one copy. */
import FC from "@/lib/flowchart";
import type { Copy } from "@/lib/handbook/copy";
import { HANDBOOK_WIDE_QUERY, tabTargetIndex } from "@/lib/tab-navigation";

/* `C` carries the widgets' own strings — see copy.ts. It is a parameter
   rather than an import because the table is chosen per locale on the
   server, and this module runs in the browser after mount. */
export default function initHandbook(C: Copy): void {

"use strict";
const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s,r) => (r||document).querySelector(s);
const $$ = (s,r) => Array.from((r||document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NS = 'http://www.w3.org/2000/svg';
function el(tag,attrs,kids){
  const n = document.createElementNS(NS,tag);
  for (const k in (attrs||{})) n.setAttribute(k,attrs[k]);
  (kids||[]).forEach(c=>n.appendChild(c));
  return n;
}
function txt(s){ return document.createTextNode(s); }

/* ============================================================
   FLOWCHART ENGINE
   Nodes are boxes; diamonds and parallelograms use the same
   bounding box so n/s/e/w anchors work identically everywhere.
   ============================================================ */
/* FC is imported from lib/flowchart */
/* ===================== THEME + TABS ===================== */
(function(){
  const btn=$('#themeBtn'), modes=['auto','light','dark']; let i=0;
  btn.addEventListener('click',()=>{
    i=(i+1)%3; const m=modes[i];
    if (m==='auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme',m);
    btn.textContent=C.t('w.theme.btn',{mode:C.t('w.theme.mode.'+m)});
  });
})();
(function(){
  const tabs=$$('.rail-btn');
  const rail=$('#rail');
  const wide=window.matchMedia(HANDBOOK_WIDE_QUERY);
  const NAMES=new Set(tabs.map(t=>t.dataset.p));
  const KEY='tch.section', SEEN='tch.seen';
  const store={
    get(k,d){ try{ return localStorage.getItem(k) ?? d; }catch(e){ return d; } },
    set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  };
  let seen=new Set((store.get(SEEN,'')||'').split(',').filter(Boolean));

  function paintSeen(){
    tabs.forEach(t=>{ if(seen.has(t.dataset.p)) t.dataset.seen='1'; });
    const c=$('#railCount');
    if (c) c.textContent = seen.size ? C.t('w.rail.seen',{seen:seen.size,total:tabs.length}) : '';
  }

  // a wide diagram that scrolls needs to say so, or on a phone you never find the rest of it
  function scrollHints(){
    $$('.fcwrap,.graphscroll,.tablewrap').forEach(w=>{
      const needs = w.scrollWidth > w.clientWidth + 4;
      let hint = w.nextElementSibling;
      const isHint = hint && hint.classList && hint.classList.contains('scrollhint');
      if (needs && !isHint){
        const h=document.createElement('div');
        h.className='scrollhint';
        h.textContent=C.t('w.theme.scrollHint');
        w.parentNode.insertBefore(h, w.nextSibling);
      } else if (!needs && isHint){ hint.remove(); }
    });
  }

  function revealTab(tab){
    if (tab && tab.scrollIntoView) tab.scrollIntoView({block:'nearest',inline:'nearest'});
  }

  function syncOrientation(){
    rail.setAttribute('aria-orientation',wide.matches?'vertical':'horizontal');
    revealTab(tabs.find(t=>t.getAttribute('aria-selected')==='true'));
  }

  function show(name, opts){
    opts=opts||{};
    if (!NAMES.has(name)) name='start';
    let activeTab=null;
    tabs.forEach(t=>{
      const on=t.dataset.p===name;
      t.setAttribute('aria-selected',on?'true':'false');
      t.tabIndex=on?0:-1;
      if (on) activeTab=t;
      const p=document.getElementById('p-'+t.dataset.p);
      if (p) p.classList.toggle('on',on);
    });
    revealTab(activeTab);
    seen.add(name); store.set(SEEN,[...seen].join(',')); store.set(KEY,name); paintSeen();

    // a real URL per section, so it can be linked, bookmarked and reached with Back
    const target='#'+name;
    if (opts.replace) history.replaceState({p:name},'',target);
    else if (location.hash!==target) history.pushState({p:name},'',target);

    if (opts.focus!==false){
      const panel=document.getElementById('p-'+name);
      if (panel) panel.focus({preventScroll:true});
    }
    if (!opts.silent && window.scrollY>120) window.scrollTo({top:0,behavior:RM?'auto':'smooth'});
    requestAnimationFrame(scrollHints);
  }

  tabs.forEach((t,idx)=>{
    t.addEventListener('click',()=>{ t.focus(); show(t.dataset.p,{focus:false}); });
    t.addEventListener('keydown',e=>{
      const vertical=rail.getAttribute('aria-orientation')==='vertical';
      const rtl=getComputedStyle(rail).direction==='rtl';
      const next=tabTargetIndex(e.key,idx,tabs.length,vertical?'vertical':'horizontal',rtl);
      if (next===null) return;
      e.preventDefault();
      const n=tabs[next];
      n.focus(); show(n.dataset.p,{focus:false});
    });
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-goto]');
    if (b) show(b.dataset.goto);
  });
  const restoreLocation=()=>{
    const h=decodeURIComponent(location.hash.slice(1));
    show(NAMES.has(h)?h:'start',{replace:true,focus:false,silent:true});
  };
  window.addEventListener('popstate',restoreLocation);
  window.addEventListener('hashchange',restoreLocation);
  let rt; window.addEventListener('resize',()=>{syncOrientation();clearTimeout(rt);rt=setTimeout(scrollHints,180);});
  if (wide.addEventListener) wide.addEventListener('change',syncOrientation);
  else if (wide.addListener) wide.addListener(syncOrientation);
  syncOrientation();

  // a link to #loop wins; otherwise pick up where they left off
  const fromHash=decodeURIComponent(location.hash.slice(1));
  const initial = NAMES.has(fromHash) ? fromHash : (store.get(KEY,'start')||'start');
  show(initial,{replace:true,focus:false,silent:true});

  $('#glossBtn').addEventListener('click',()=>{
    show('compare');
    const g=$('#glossary');
    if (g) setTimeout(()=>g.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'}),60);
  });

  // results that change without a click should be announced, not silently swapped
  ['#codeOut','#modelOut','#packOut','#packVerdict','#lBanner','#lStatus','#gResultBox',
   '#hVerdict','#hIncidents','#evVerdict','#secVerdict','#secActions','#gFeedback','#recTitle']
    .forEach(sel=>{ const n=$(sel); if(n){ n.setAttribute('aria-live','polite'); n.setAttribute('aria-atomic','true'); } });

  window.__show=show;
})();

/* ============== THE FOUR "METHOD IN 4 STEPS" STRIPS ============== */
FC.strip($('#stripCode'),
  [[C.t('w.method.strip.code.s1'),C.t('w.method.strip.code.s1sub')],[C.t('w.method.strip.code.s2'),C.t('w.method.strip.code.s2sub')],
   [C.t('w.method.strip.code.s3'),C.t('w.method.strip.code.s3sub')],[C.t('w.method.strip.code.s4'),C.t('w.method.strip.code.s4sub')]],
  C.t('w.method.strip.code.back'));
FC.strip($('#stripPrompt'),
  [[C.t('w.method.strip.prompt.s1'),C.t('w.method.strip.prompt.s1sub')],[C.t('w.method.strip.prompt.s2'),C.t('w.method.strip.prompt.s2sub')],
   [C.t('w.method.strip.prompt.s3'),C.t('w.method.strip.prompt.s3sub')],[C.t('w.method.strip.prompt.s4'),C.t('w.method.strip.prompt.s4sub')]],
  C.t('w.method.strip.prompt.back'));
FC.strip($('#stripContext'),
  [[C.t('w.method.strip.context.s1'),C.t('w.method.strip.context.s1sub')],[C.t('w.method.strip.context.s2'),C.t('w.method.strip.context.s2sub')],
   [C.t('w.method.strip.context.s3'),C.t('w.method.strip.context.s3sub')],[C.t('w.method.strip.context.s4'),C.t('w.method.strip.context.s4sub')]],
  C.t('w.method.strip.context.back'));
FC.strip($('#stripLoop'),
  [[C.t('w.method.strip.loop.s1'),C.t('w.method.strip.loop.s1sub')],[C.t('w.method.strip.loop.s2'),C.t('w.method.strip.loop.s2sub')],
   [C.t('w.method.strip.loop.s3'),C.t('w.method.strip.loop.s3sub')],[C.t('w.method.strip.loop.s4'),C.t('w.method.strip.loop.s4sub')]],
  C.t('w.method.strip.loop.back'));
FC.strip($('#stripGraph'),
  [[C.t('w.method.strip.graph.s1'),C.t('w.method.strip.graph.s1sub')],[C.t('w.method.strip.graph.s2'),C.t('w.method.strip.graph.s2sub')],
   [C.t('w.method.strip.graph.s3'),C.t('w.method.strip.graph.s3sub')],[C.t('w.method.strip.graph.s4'),C.t('w.method.strip.graph.s4sub')]],
  C.t('w.method.strip.graph.back'));

/* ============================================================
   CONNECTIVE TISSUE
   Every section opens by making you retrieve the previous one —
   from something you did with your hands, not something you read —
   and closes by naming what it builds on and what it unlocks.
   ============================================================ */
/* The ordinal stays here and the name comes from the table: the recall tag
   reads the number back off this string with n.slice(0,2), so the digits are
   structure rather than copy, and only the words after them are translated. */
const SEC={
  code:    {n:'01 '+C.t('w.sec.name.code'),    c:'blue'},
  prompt:  {n:'02 '+C.t('w.sec.name.prompt'),  c:'teal'},
  context: {n:'03 '+C.t('w.sec.name.context'), c:'magenta'},
  loop:    {n:'04 '+C.t('w.sec.name.loop'),    c:'amber'},
  graph:   {n:'05 '+C.t('w.sec.name.graph'),   c:'violet'},
  harness: {n:'06 '+C.t('w.sec.name.harness'), c:'steel'},
  evals:   {n:'07 '+C.t('w.sec.name.evals'),   c:'olive'},
  security:{n:'08 '+C.t('w.sec.name.security'),c:'bronze'}
};
const DEPS={
  code:    {on:[],                    un:['prompt','harness']},
  prompt:  {on:['code'],              un:['context','loop','evals']},
  context: {on:['prompt'],            un:['loop','security'],
            note:C.t('w.method.note.context')},
  loop:    {on:['prompt','context'],  un:['graph','harness']},
  graph:   {on:['loop','code'],       un:['harness']},
  harness: {on:['code','loop'],       un:['evals','security'],
            note:C.t('w.method.note.harness')},
  evals:   {on:['code','prompt'],     un:[],
            note:C.t('w.method.note.evals')},
  security:{on:['context','harness'], un:[],
            note:C.t('w.method.note.security')}
};
const RECALL={
  prompt:{from:'code',
    q:C.h('w.method.recall.prompt.q'),
    a:C.h('w.method.recall.prompt.a',{code:'<code>if</code>'})},
  context:{from:'prompt',
    q:C.h('w.method.recall.context.q'),
    a:C.h('w.method.recall.context.a')},
  loop:{from:'context',
    q:C.h('w.method.recall.loop.q'),
    a:C.h('w.method.recall.loop.a')},
  graph:{from:'loop',
    q:C.h('w.method.recall.graph.q'),
    a:C.h('w.method.recall.graph.a')},
  harness:{from:'graph',
    q:C.h('w.method.recall.harness.q'),
    a:C.h('w.method.recall.harness.a')},
  evals:{from:'prompt',
    q:C.h('w.method.recall.evals.q'),
    a:C.h('w.method.recall.evals.a',{code:'<code>expect(x).toBe(y)</code>'})},
  security:{from:'harness',
    q:C.h('w.method.recall.security.q'),
    a:C.h('w.method.recall.security.a')}
};

(function(){
  Object.keys(SEC).forEach(id=>{
    const panel=document.getElementById('p-'+id); if(!panel) return;

    // --- the recall card, tinted in the colour of the section it reaches back to ---
    const r=RECALL[id];
    if (r){
      const src=SEC[r.from];
      const card=document.createElement('div');
      card.className='recall';
      card.style.setProperty('--rc','var(--'+src.c+')');
      card.style.setProperty('--rc-soft','var(--'+src.c+'-soft)');
      card.innerHTML='<span class="rtag">'+C.h('w.recall.back',{n:src.n.slice(0,2)})+'</span>'+
        '<div class="rq">'+r.q+'</div>'+
        '<div class="rbtns"><button class="btn" type="button">'+C.h('w.method.recall.show')+'</button>'+
        '<button class="btn ghost" type="button" data-goto="'+r.from+'">'+C.h('w.recall.reopen',{section:esc(src.n)})+'</button></div>'+
        '<div class="ra" hidden><p>'+r.a+'</p></div>';
      const [show]=card.querySelectorAll('button');
      show.addEventListener('click',()=>{
        const a=card.querySelector('.ra');
        a.hidden=!a.hidden;
        show.textContent=a.hidden?C.t('w.method.recall.show'):C.t('w.method.recall.hide');
      });
      const head=panel.querySelector('.sec-head');
      head.parentNode.insertBefore(card,head.nextSibling);
    }

    // --- builds on / unlocks ---
    const d=DEPS[id]; if(!d) return;
    const bar=document.createElement('div');
    bar.className='deps';
    const group=(label,list)=>{
      if(!list.length) return '';
      return '<div class="dgroup"><span class="dl">'+label+'</span>'+list.map(k=>
        '<button class="dchip" type="button" data-goto="'+k+'" style="--dc:var(--'+SEC[k].c+
        ');--dc-soft:var(--'+SEC[k].c+'-soft)">'+esc(SEC[k].n)+'</button>').join('')+'</div>';
    };
    bar.innerHTML=group(C.h('w.method.deps.buildsOn'),d.on)+group(C.h('w.method.deps.unlocks'),d.un)+
      (d.note?'<p class="dnote">⤫ '+esc(d.note)+'</p>':'');
    const nav=panel.querySelector('.section-nav');
    if (nav) nav.parentNode.insertBefore(bar,nav);
  });
})();

/* ===================== 00 — THE DEPENDENCY MAP ===================== */
(function(){
  const svg=$('#depMap'); if(!svg) return;
  const W=196,H=58,SH=84;
  const SHORT={code:C.t('w.map.short.code'),prompt:C.t('w.map.short.prompt'),loop:C.t('w.map.short.loop'),graph:C.t('w.map.short.graph'),
               context:C.t('w.map.short.context'),harness:C.t('w.map.short.harness'),evals:C.t('w.map.short.evals'),security:C.t('w.map.short.security')};
  const SPINE=[['code',C.t('w.map.sub.code')],['prompt',C.t('w.map.sub.prompt')],
               ['loop',C.t('w.map.sub.loop')],['graph',C.t('w.map.sub.graph')]];
  const SUPPORT=[['context',C.t('w.map.sub.context')],['harness',C.t('w.map.sub.harness')],
                 ['evals',C.t('w.map.sub.evals')],['security',C.t('w.map.sub.security')]];
  const xs=[20,240,460,680];

  function box(id,sub,x,y,h){
    const c=SEC[id].c;
    const g=el('g',{class:'dm-box',tabindex:'0',role:'button','aria-label':SEC[id].n});
    g.appendChild(el('rect',{x:x,y:y,width:W,height:h,rx:8,
      fill:'var(--'+c+'-soft)',stroke:'var(--'+c+')'}));
    const t=el('text',{x:x+W/2,y:y+(h>70?26:24),style:'font-size:13px;font-weight:700'});
    t.appendChild(txt(SHORT[id])); g.appendChild(t);
    // wrap the sub-label to two lines if it is long
    const words=sub.split(' '); const lines=[]; let cur='';
    words.forEach(w=>{ if((cur+' '+w).trim().length>28){lines.push(cur.trim());cur=w;} else cur+=' '+w; });
    lines.push(cur.trim());
    lines.forEach((ln,i)=>{
      const st=el('text',{x:x+W/2,y:y+(h>70?46:44)+i*14,class:'dm-sub'});
      st.appendChild(txt(ln)); g.appendChild(st);
    });
    g.addEventListener('click',()=>window.__show(id));
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.__show(id);}});
    svg.appendChild(g);
  }

  const defs=el('defs');
  const m=el('marker',{id:'dmA',viewBox:'0 0 9 9',refX:'7.5',refY:'4.5',markerWidth:'5.5',markerHeight:'5.5',orient:'auto-start-reverse'});
  m.appendChild(el('path',{d:'M0,0 L9,4.5 L0,9 z',fill:'var(--line-2)'}));
  defs.appendChild(m); svg.appendChild(defs);

  const capA=el('text',{x:20,y:24,class:'dm-cap'});
  capA.appendChild(txt(C.t('w.map.cap.sequence')));
  svg.appendChild(capA);

  SPINE.forEach(([id,sub],i)=>box(id,sub,xs[i],40,H));
  for(let i=0;i<3;i++){
    svg.appendChild(el('path',{d:'M'+(xs[i]+W)+',69 L'+(xs[i+1]-7)+',69',
      stroke:'var(--line-2)','stroke-width':2,fill:'none','marker-end':'url(#dmA)'}));
  }
  // the band that separates "pick one of these" from "you need all of these"
  svg.appendChild(el('line',{x1:20,y1:156,x2:876,y2:156,stroke:'var(--line-2)','stroke-width':1.5,'stroke-dasharray':'7 6'}));
  const capB=el('text',{x:20,y:180,class:'dm-cap'});
  capB.appendChild(txt(C.t('w.map.cap.support')));
  svg.appendChild(capB);
  SUPPORT.forEach(([id,sub],i)=>{
    box(id,sub,xs[i],204,SH);
    svg.appendChild(el('path',{d:'M'+(xs[i]+W/2)+',200 L'+(xs[i]+W/2)+',160',
      stroke:'var(--'+SEC[id].c+')','stroke-width':1.6,'stroke-dasharray':'4 4',fill:'none',opacity:'.75'}));
  });
  const foot=el('text',{x:20,y:330,class:'dm-sub',style:'text-anchor:start'});
  foot.appendChild(txt(C.t('w.map.foot')));
  svg.appendChild(foot);
})();

/* ===================== 00 — THE DIAL ===================== */
(function(){
  const svg=$('#dialSvg');
  const L=100,R=706,T=48,B=318;
  const px=x=>L+x*(R-L), py=y=>B-y*(B-T);
  [0.25,0.5,0.75].forEach(f=>{
    svg.appendChild(el('line',{x1:px(f),y1:T,x2:px(f),y2:B,stroke:'var(--line)','stroke-width':1,'stroke-dasharray':'2 6'}));
    svg.appendChild(el('line',{x1:L,y1:py(f),x2:R,y2:py(f),stroke:'var(--line)','stroke-width':1,'stroke-dasharray':'2 6'}));
  });
  svg.appendChild(el('line',{x1:L,y1:B,x2:R,y2:B,class:'axis'}));
  svg.appendChild(el('line',{x1:L,y1:T,x2:L,y2:B,class:'axis'}));
  function lab(x,y,s,cls,anchor){
    const t=el('text',{x:x,y:y,class:cls||'axlabel'});
    if (anchor) t.setAttribute('style','text-anchor:'+anchor);
    t.appendChild(txt(s)); svg.appendChild(t); return t;
  }
  lab(L,B+24,C.t('w.dial.axis.human'));
  lab(R,B+24,C.t('w.dial.axis.model'),'axlabel','end');
  lab(L,B+45,C.t('w.dial.axis.caption'));
  const yl=el('text',{class:'axlabel',transform:'translate('+(L-20)+','+((T+B)/2)+') rotate(-90)','style':'text-anchor:middle'});
  yl.appendChild(txt(C.t('w.dial.axis.autonomy'))); svg.appendChild(yl);

  const pts=[
    {id:'code',  x:0.05,y:0.15,h:1.00,c:'blue',   t:C.t('w.dial.label.code'),  s:C.t('w.dial.sub.code'),  lx:41, ly:0,  a:'start'},
    {id:'prompt',x:0.40,y:0.30,h:0.88,c:'teal',   t:C.t('w.dial.label.prompt'),s:C.t('w.dial.sub.prompt'),lx:41, ly:0,  a:'start'},
    {id:'loop',  x:0.90,y:0.84,h:0.20,c:'amber',  t:C.t('w.dial.label.loop'),  s:C.t('w.dial.sub.loop'),  lx:-42,ly:0,  a:'end'},
    {id:'graph', x:0.50,y:0.92,h:0.65,c:'violet', t:C.t('w.dial.label.graph'), s:C.t('w.dial.sub.graph'), lx:0,  ly:-32,a:'middle'}
  ];
  pts.forEach(p=>{
    const cx=px(p.x), cy=py(p.y), w=62, hh=17;
    const g=el('g',{class:'scatter-pt',tabindex:'0',role:'button','aria-label':p.t});
    g.appendChild(el('rect',{x:cx-w/2-9,y:cy-hh/2-9,width:w+18,height:hh+18,fill:'transparent'}));
    g.appendChild(el('rect',{x:cx-w/2-4,y:cy-hh/2-4,width:w+8,height:hh+8,rx:6,fill:'none',stroke:'var(--'+p.c+')','stroke-width':1.5,opacity:.4}));
    g.appendChild(el('rect',{x:cx-w/2,y:cy-hh/2,width:w*p.h,height:hh,fill:'var(--blue)',rx:'2'}));
    g.appendChild(el('rect',{x:cx-w/2+w*p.h,y:cy-hh/2,width:w*(1-p.h),height:hh,fill:'var(--amber)'}));
    g.appendChild(el('rect',{x:cx-w/2,y:cy-hh/2,width:w,height:hh,rx:'2',fill:'none',stroke:'var(--line-2)'}));
    const t1=el('text',{x:cx+p.lx,y:cy+p.ly,class:'plabel',style:'text-anchor:'+p.a});
    t1.appendChild(txt(p.t)); g.appendChild(t1);
    const t2=el('text',{x:cx+p.lx,y:cy+p.ly+15,class:'psub',style:'text-anchor:'+p.a});
    t2.appendChild(txt(p.s)); g.appendChild(t2);
    g.addEventListener('click',()=>window.__show(p.id));
    g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();window.__show(p.id);} });
    svg.appendChild(g);
  });
  const lg=el('g',{transform:'translate(418,'+(B+62)+')'});
  lg.appendChild(el('rect',{x:0,y:0,width:36,height:10,fill:'var(--blue)',rx:'2'}));
  lg.appendChild(el('rect',{x:36,y:0,width:14,height:10,fill:'var(--amber)'}));
  lg.appendChild(el('rect',{x:0,y:0,width:50,height:10,rx:'2',fill:'none',stroke:'var(--line-2)'}));
  const lt=el('text',{x:58,y:9,class:'psub'}); lt.appendChild(txt(C.t('w.dial.legend')));
  lg.appendChild(lt); svg.appendChild(lg);
})();
/* ===================== 01 — THE KIOSK ===================== */
(function(){
  const BASE=[
    {k:C.t('w.code.rule.coffee'),label:C.t('w.code.label.coffee'),price:'3.00'},
    {k:C.t('w.code.rule.tea'),label:C.t('w.code.label.tea'),price:'2.00'},
    {k:C.t('w.code.rule.juice'),label:C.t('w.code.label.juice'),price:'4.00'}
  ];
  let rules=BASE.slice(), outputs=new Set(), runs=0, lastInput=null, timer=null, fc=null;
  const codebox=$('#codebox'), trace=$('#codeTrace'), out=$('#codeOut');

  function renderCode(){
    const lines=[{h:'<span class="tok-k">function</span> order(text) {'},{h:'  text = text.toLowerCase().trim();'}];
    rules.forEach((r,i)=>lines.push({rule:i,
      h:'  <span class="tok-k">if</span> (text === <span class="tok-s">"'+esc(r.k)+'"</span>) <span class="tok-k">return</span> <span class="tok-s">"'+esc(r.label)+' — $'+r.price+'"</span>;'}));
    lines.push({fallback:true,h:'  <span class="tok-k">return</span> <span class="tok-s">"'+esc(C.t('w.code.out.fail'))+'"</span>;'});
    lines.push({h:'}'});
    codebox.innerHTML='';
    lines.forEach(l=>{
      const d=document.createElement('div'); d.className='cl'; d.innerHTML=l.h;
      if (l.rule!==undefined) d.dataset.rule=l.rule;
      if (l.fallback) d.dataset.fallback='1';
      codebox.appendChild(d);
    });
    $('#ruleCount').textContent=C.t(C.p('w.code.ruleCount',rules.length),{n:rules.length});
    renderFC();
  }

  function short(s){ return s.length>13 ? s.slice(0,12)+'…' : s; }

  function renderFC(){
    const n=rules.length, GAP=104, TOP=170;
    const H=TOP+n*GAP+72, CX=178;
    const nodes=[
      {id:'start',type:'start',x:CX-118,y:14,w:236,h:40,lines:[C.t('w.code.fc.start')]},
      {id:'norm', type:'proc', x:CX-118,y:86,w:236,h:44,lines:[C.t('w.code.fc.norm1'),C.t('w.code.fc.norm2')]}
    ];
    const edges=[{from:'start',to:'norm'}];
    rules.forEach((r,i)=>{
      const cy=TOP+i*GAP, dy=cy-40;
      nodes.push({id:'d'+i,type:'dec',x:CX-140,y:dy,w:280,h:80,lines:[C.t('w.code.fc.isIt'),'"'+short(r.k)+'" ?'],fs:11});
      nodes.push({id:'o'+i,type:'out',x:430,y:cy-21,w:198,h:42,lines:[C.t('w.code.fc.out',{label:r.label,price:r.price})],fs:11});
      edges.push({from:'d'+i,to:'o'+i,fs:'e',ts:'w',kind:'yes',label:C.t('w.code.fc.yes'),lx:390,ly:cy-8});
      if (i<n-1) edges.push({from:'d'+i,to:'d'+(i+1),kind:'no',label:C.t('w.code.fc.no'),lx:CX+16,ly:cy+58});
    });
    const fy=TOP+n*GAP-40;
    nodes.push({id:'fail',type:'err',x:CX-138,y:fy,w:276,h:46,lines:[C.t('w.code.fc.fail')],fs:11});
    edges.push({from:'d'+(n-1),to:'fail',kind:'no',label:C.t('w.code.fc.no'),lx:CX+16,ly:fy-14});
    fc=FC.draw($('#fcCode'),{viewBox:'0 0 660 '+H,nodes:nodes,edges:edges});
    dimAll();
  }
  function dimAll(){
    if (!fc) return;
    Object.values(fc.nodes).forEach(g=>{g.classList.add('dim');g.classList.remove('live','pulse');});
    Object.values(fc.edges).forEach(p=>p.classList.add('dim'));
    Object.values(fc.edges).forEach(p=>p.classList.remove('live'));
    Object.values(fc.labels).forEach(t=>{t.classList.add('dim');t.classList.remove('live');});
  }
  function liveN(id,pulse){
    const g=fc.nodes[id]; if(!g) return;
    g.classList.remove('dim'); g.classList.add('live');
    if (pulse) g.classList.add('pulse');
  }
  function liveE(k){
    const p=fc.edges[k]; if(p){p.classList.remove('dim');p.classList.add('live');}
    const t=fc.labels[k]; if(t){t.classList.remove('dim');t.classList.add('live');}
  }

  const PRESETS=[
    C.t('w.code.rule.coffee'),C.t('w.code.preset.coffeeCase'),' '+C.t('w.code.rule.tea')+' ',
    C.t('w.code.preset.latte'),C.t('w.code.preset.warm'),C.t('w.code.preset.typo')
  ];
  (function(){
    const box=$('#inputBtns');
    PRESETS.forEach(p=>{
      const b=document.createElement('button');
      b.className='btn'; b.type='button'; b.textContent='"'+p+'"';
      b.addEventListener('click',()=>run(p));
      box.appendChild(b);
    });
  })();

  function run(input){
    if (timer){clearInterval(timer);timer=null;}
    $$('.cl',codebox).forEach(c=>c.classList.remove('active','hit'));
    dimAll(); trace.innerHTML=''; out.hidden=true;
    const norm=String(input).toLowerCase().trim();
    if (input!==lastInput){ lastInput=input; runs=0; outputs=new Set(); }

    const add=h=>{ const d=document.createElement('div'); d.className='tr'; d.innerHTML=h; trace.appendChild(d); trace.scrollTop=trace.scrollHeight; };
    add('<span style="color:var(--ink-3)">'+C.h('w.code.trace.in')+'</span><span>"'+esc(input)+'"</span>');
    add('<span style="color:var(--ink-3)">'+C.h('w.code.trace.tidy')+'</span><span>"'+esc(norm)+'"</span>');
    liveN('start'); liveN('norm'); liveE('start>norm');

    let i=0; const total=rules.length, speed=RM?0:430;
    function settle(value,ok){
      out.hidden=false; out.className='out '+(ok?'ok':'bad');
      $('.val',out).textContent=value;
      runs++; outputs.add(value);
      $('#cRuns').textContent=runs; $('#cDistinct').textContent=outputs.size;
      const v=$('#cVerdict'); v.className='chip ok';
      v.textContent = runs<3 ? C.t('w.code.verdict.more') : C.t('w.code.verdict.always',{runs:runs});
    }
    function tick(){
      $$('.cl',codebox).forEach(c=>c.classList.remove('active'));
      if (i>=total){
        const fb=$('.cl[data-fallback]',codebox); if(fb) fb.classList.add('active');
        liveE('d'+(total-1)+'>fail'); liveN('fail',true);
        add('<span class="m">✗</span><span>'+C.h('w.code.trace.noMatch')+'</span>');
        settle(C.t('w.code.out.fail'),false); return true;
      }
      const r=rules[i], line=$('.cl[data-rule="'+i+'"]',codebox), hit=(norm===r.k);
      if (line) line.classList.add(hit?'hit':'active');
      if (i>0) liveE('d'+(i-1)+'>d'+i);
      liveN('d'+i,true);
      add((hit?'<span class="y">✓</span>':'<span class="m">✗</span>')+'<span>text === "'+esc(r.k)+'" &nbsp;→&nbsp; '+(hit?'true':'false')+'</span>');
      if (hit){ liveE('d'+i+'>o'+i); liveN('o'+i,true); settle(C.t('w.code.out.ok',{label:r.label,price:r.price}),true); return true; }
      i++; return false;
    }
    if (speed===0){ while(!tick()){} return; }
    timer=setInterval(()=>{ if(tick()){clearInterval(timer);timer=null;} },speed);
  }

  $('#runCustom').addEventListener('click',()=>{ const v=$('#customInput').value.trim(); if(v) run(v); });
  $('#customInput').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#runCustom').click(); });
  $('#addRule').addEventListener('click',()=>{
    const v=$('#newWord').value.toLowerCase().trim();
    if (!v || rules.some(r=>r.k===v)) return;
    rules.push({k:v,label:C.t('w.code.label.coffee'),price:'3.00'});
    $('#newWord').value=''; renderCode();
    const warn=$('#ruleWarn'); warn.hidden=false;
    warn.innerHTML = (rules.length-3<3)
      ? '<div class="banner">'+C.h('w.code.warn.more',{n:rules.length})+'</div>'
      : '<div class="banner warn">'+C.h('w.code.warn.wall',{n:rules.length})+'</div>';
  });
  $('#resetRules').addEventListener('click',()=>{
    rules=BASE.slice(); renderCode();
    lastInput=null; runs=0; outputs=new Set();
    $('#cRuns').textContent='0'; $('#cDistinct').textContent='0';
    $('#cVerdict').textContent=C.t('w.code.verdict.start');
    $('#ruleWarn').hidden=true; out.hidden=true;
    trace.innerHTML='<div class="mono-note">'+C.h('w.code.pick')+'</div>';
  });
  renderCode();
})();
/* ===================== 02 — PROMPT BUILDER ===================== */
(function(){
  const CUSTOMER=C.t('w.prompt.customer');
  const PARTS=[
    {id:'role',name:C.t('w.prompt.part.role.name'),emoji:'🎭',pts:12,
     desc:C.t('w.prompt.part.role.desc'),
     text:C.t('w.prompt.part.role.text')},
    {id:'menu',name:C.t('w.prompt.part.menu.name'),emoji:'📋',pts:28,
     desc:C.t('w.prompt.part.menu.desc'),
     text:C.t('w.prompt.part.menu.text')},
    {id:'format',name:C.t('w.prompt.part.format.name'),emoji:'🧾',pts:20,
     desc:C.t('w.prompt.part.format.desc'),
     text:C.t('w.prompt.part.format.text')},
    {id:'examples',name:C.t('w.prompt.part.examples.name'),emoji:'🎯',pts:20,
     desc:C.t('w.prompt.part.examples.desc'),
     text:C.t('w.prompt.part.examples.text')},
    {id:'rules',name:C.t('w.prompt.part.rules.name'),emoji:'🛡️',pts:20,
     desc:C.t('w.prompt.part.rules.desc'),
     text:C.t('w.prompt.part.rules.text')}
  ];
  const on={role:false,menu:false,format:false,examples:false,rules:false};
  let variant=0, runs=1, seen=new Set(), pfc=null;

  /* --- the pipeline flowchart --- */
  (function(){
    const nodes=[], edges=[];
    PARTS.forEach((p,i)=>{
      nodes.push({id:p.id,type:'idle',x:14,y:12+i*38,w:172,h:32,lines:[p.emoji+' '+p.name],fs:10.5});
      edges.push({from:p.id,to:'asm',fs:'e',ts:'w',via:[{x:214,y:28+i*38},{x:214,y:125}]});
    });
    nodes.push({id:'msg',type:'tool',x:14,y:212,w:172,h:44,lines:[C.t('w.prompt.fc.msg1'),C.t('w.prompt.fc.msg2')],fs:10.5});
    edges.push({from:'msg',to:'asm',fs:'e',ts:'w',via:[{x:214,y:234},{x:214,y:125}]});
    nodes.push({id:'asm',type:'proc',x:258,y:70,w:158,h:110,lines:[C.t('w.prompt.fc.asm1'),C.t('w.prompt.fc.asm2'),C.t('w.prompt.fc.asm3')],fs:11.5});
    nodes.push({id:'mdl',type:'model',x:474,y:98,w:158,h:54,lines:[C.t('w.prompt.fc.mdl1'),C.t('w.prompt.fc.mdl2')],fs:11.5});
    nodes.push({id:'ans',type:'model',x:690,y:98,w:136,h:54,lines:[C.t('w.prompt.fc.ans')],fs:11.5});
    nodes.push({id:'code',type:'proc',x:884,y:98,w:132,h:54,lines:[C.t('w.prompt.fc.code1'),C.t('w.prompt.fc.code2')],fs:11.5});
    edges.push({from:'asm',to:'mdl',fs:'e',ts:'w'});
    edges.push({from:'mdl',to:'ans',fs:'e',ts:'w'});
    edges.push({from:'ans',to:'code',fs:'e',ts:'w'});
    edges.push({from:'ans',to:'asm',fs:'s',ts:'s',dash:true,kind:'no',
      via:[{x:758,y:236},{x:337,y:236}],label:C.t('w.prompt.fc.noTurn'),lx:548,ly:256});
    pfc=FC.draw($('#fcPrompt'),{viewBox:'0 0 1030 300',nodes:nodes,edges:edges,
      captions:[{t:C.t('w.prompt.fc.caption'),x:14,y:284}]});
  })();

  const tgBox=$('#pToggles');
  PARTS.forEach(p=>{
    const b=document.createElement('button');
    b.className='tg'; b.type='button'; b.setAttribute('aria-pressed','false'); b.dataset.id=p.id;
    b.innerHTML='<span class="sw" aria-hidden="true"></span><span><span class="nm">'+p.emoji+' '+esc(p.name)+
      ' <span class="pts">+'+p.pts+'</span></span><span class="ds">'+esc(p.desc)+'</span></span>';
    b.addEventListener('click',()=>{
      on[p.id]=!on[p.id];
      b.setAttribute('aria-pressed',on[p.id]?'true':'false');
      seen=new Set(); runs=0; variant=0; render(true);
    });
    tgBox.appendChild(b);
  });
  function syncToggles(){ $$('.tg',tgBox).forEach(b=>b.setAttribute('aria-pressed',on[b.dataset.id]?'true':'false')); }
  $('#pAll').addEventListener('click',()=>{PARTS.forEach(p=>on[p.id]=true);syncToggles();seen=new Set();runs=0;render(true);});
  $('#pNone').addEventListener('click',()=>{PARTS.forEach(p=>on[p.id]=false);syncToggles();seen=new Set();runs=0;render(true);});
  /* ---- shared progress: this page, Part 1.5 and the Python course ----
     One localStorage object, written by play.html too, so the learner sees
     one journey rather than three disconnected things. No account, no
     server, no tracking — it never leaves the browser. */
  (function(){
    const PROG='ae.progress';
    const read=()=>{try{return JSON.parse(localStorage.getItem(PROG)||'{}')}catch(e){return{}}};
    /* Read sections straight from storage, NOT from the enclosing `seen` —
       that one counts distinct model answers in this section and is a
       different thing entirely. */
    const sectionsRead=()=>{try{
      return (localStorage.getItem('tch.seen')||'').split(',').filter(Boolean).length;
    }catch(e){return 0;}};
    const ITEMS=[
      ['read',  C.t('w.progress.item.read'),  ()=>sectionsRead()>=6, ()=>C.t('w.progress.sections',{n:sectionsRead()})],
      ['play0', C.t('w.progress.item.play0'), p=>!!p.play0],
      ['play1', C.t('w.progress.item.play1'), p=>!!p.play1],
      ['play2', C.t('w.progress.item.play2'), p=>!!p.play2],
      ['play3', C.t('w.progress.item.play3'), p=>p.evalBest?C.t('w.progress.evalBest',{n:p.evalBest}):false],
      ['part2', C.t('w.progress.item.part2'), p=>!!p.part2]
    ];
    function paint(){
      const p=read();
      const card=$('#progCard'), ul=$('#progList');
      const states=ITEMS.map(([k,label,test,extra])=>{
        const v=test(p); return {label,done:!!v,
          note:typeof v==='string'?v:(extra?extra():'')};
      });
      const n=states.filter(s=>s.done).length;
      if(!n){ card.hidden=true; return; }      // nothing to brag about yet
      card.hidden=false;
      ul.innerHTML='';
      states.forEach(st=>{
        const li=document.createElement('li');
        li.className=st.done?'done':'';
        li.innerHTML='<span class="tick">'+(st.done?'✓':'○')+'</span><span>'+
          esc(st.label)+(st.note?' <span class="mono-note">'+esc(st.note)+'</span>':'')+'</span>';
        ul.appendChild(li);
      });
      $('#progPct').textContent=C.t('w.progress.count',{done:n,total:ITEMS.length});
      const nextUp=states.findIndex(s=>!s.done);
      $('#progNext').innerHTML = nextUp<0
        ? C.h('w.progress.done',{link:'<a href="https://github.com/HUDongpin/agent-edu/blob/main/course/README.md" rel="noopener">'+C.h('w.progress.done.link')+'</a>'})
        : C.h('w.progress.next',{label:esc(states[nextUp].label)})+
          (nextUp>0&&nextUp<5?C.h('w.progress.next.lab',{link:'<a href="../lab/">'+C.h('w.progress.next.lab.link')+'</a>'}):'');
    }
    paint();
    window.addEventListener('storage',paint);
    window.addEventListener('focus',paint);
    window.__paintProgress=paint;
  })();

  $('#pRun').addEventListener('click',()=>{ variant++; render(true); });

  const FAKE_PRICES=['5.75','4.50','6.25'];
  const FAKE_KID=[[C.t('w.prompt.fake.kid1'),'2.95'],[C.t('w.prompt.fake.kid2'),'2.50'],[C.t('w.prompt.fake.kid3'),'3.25']];
  const KEYNAMES=[['drink','qty'],['item','size'],['product','variant']];
  const PREAMBLES=[C.t('w.prompt.preamble1'),
                   C.t('w.prompt.preamble2'),
                   C.t('w.prompt.preamble3')];

  function buildOutput(){
    const v=variant%3, issues=[];
    const price1 = on.menu ? '5.10' : FAKE_PRICES[v];
    const kid = on.menu
      ? (on.rules ? {name:C.t('w.prompt.item.hotChocolate'),size:'S',price:'3.50'} : {name:C.t('w.prompt.item.hotChocolate'),size:'L',price:'4.20'})
      : {name:FAKE_KID[v][0],size:'S',price:FAKE_KID[v][1]};
    const dropsKid = (!on.rules && !on.examples && v===2);
    let body='';
    if (on.format){
      const k = on.examples ? ['name','size'] : KEYNAMES[v];
      const rows=['    {"'+k[0]+'":"'+C.t('w.prompt.item.flatWhite')+'","'+k[1]+'":"L","price":'+price1+'}'];
      if (!dropsKid) rows.push('    {"'+k[0]+'":"'+kid.name+'","'+k[1]+'":"'+kid.size+'","price":'+kid.price+'}');
      const total=(parseFloat(price1)+(dropsKid?0:parseFloat(kid.price))).toFixed(2);
      body='{\n  "items": [\n'+rows.join(',\n')+'\n  ],\n  "total": '+total+(on.rules?',\n  "needs_confirmation": true':'')+'\n}';
      if (on.rules) body+=C.t('w.prompt.answer.flag');
    } else {
      const sizeWord = C.t(kid.size==='L' ? 'w.prompt.size.large' : 'w.prompt.size.small');
      const total=(parseFloat(price1)+(dropsKid?0:parseFloat(kid.price))).toFixed(2);
      body=C.t('w.prompt.answer.main',{price:price1,total:total,
        plus:(dropsKid?'':C.t('w.prompt.answer.plus',{size:sizeWord,item:kid.name.toLowerCase(),price:kid.price})),
        note:(on.rules?C.t('w.prompt.answer.note'):'')});
    }
    if (!on.role) body=PREAMBLES[v]+body+C.t('w.prompt.answer.signoff');

    const add=(ok,bt,gt,fix)=>issues.push({bad:!ok,t:ok?gt:bt,fix:fix});
    add(on.menu,C.t('w.prompt.issue.menu.bad'),C.t('w.prompt.issue.menu.good'),C.t('w.prompt.toggle.menu'));
    add(on.format,C.t('w.prompt.issue.format.bad'),C.t('w.prompt.issue.format.good'),C.t('w.prompt.toggle.format'));
    add(on.examples,C.t('w.prompt.issue.examples.bad'),C.t('w.prompt.issue.examples.good'),C.t('w.prompt.toggle.examples'));
    add(on.rules,C.t('w.prompt.issue.rules.bad'),C.t('w.prompt.issue.rules.good'),C.t('w.prompt.toggle.rules'));
    add(on.role,C.t('w.prompt.issue.role.bad'),C.t('w.prompt.issue.role.good'),C.t('w.prompt.toggle.role'));
    return {body,issues};
  }

  function render(newRun){
    const pb=$('#promptBox'); pb.innerHTML='';
    let words=0, any=false;
    PARTS.forEach(p=>{
      const node=pfc.nodes[p.id];
      if (node){ node.setAttribute('class','fc-n t-'+(on[p.id]?'proc':'idle')); node.classList.toggle('dim',!on[p.id]); }
      const e=pfc.edges[p.id+'>asm']; if(e) e.classList.toggle('dim',!on[p.id]);
      if (!on[p.id]) return;
      any=true;
      const s=document.createElement('span'); s.className='seg';
      s.innerHTML='<span class="segname">— '+esc(p.name.toUpperCase())+' —</span>\n'+esc(p.text)+'\n';
      pb.appendChild(s); words+=p.text.split(/\s+/).length;
    });
    if (!any){
      const s=document.createElement('span'); s.className='seg ph';
      s.textContent=C.t('w.prompt.empty');
      pb.appendChild(s);
    }
    const um=document.createElement('span'); um.className='usermsg';
    um.innerHTML='<span class="segname">'+C.h('w.prompt.customerMessage')+'</span>\n'+esc(CUSTOMER);
    pb.appendChild(um);
    words+=CUSTOMER.split(/\s+/).length;
    $('#pWords').textContent=C.t('w.prompt.words',{n:words});

    const {body,issues}=buildOutput();
    $('#modelOut').textContent=body;
    let s=0; PARTS.forEach(p=>{ if(on[p.id]) s+=p.pts; });
    $('#qFill').style.width=Math.max(4,s)+'%';
    $('#qNum').textContent=C.t('w.prompt.score',{n:s});
    $('#qFill').style.background = s>=80?'var(--green)':(s>=45?'var(--amber)':'var(--red)');

    const ib=$('#pIssues'); ib.innerHTML='';
    issues.forEach(i=>{
      const d=document.createElement('div'); d.className='iss '+(i.bad?'bad':'good');
      d.innerHTML='<span>'+(i.bad?'✗':'✓')+'</span><span>'+esc(i.t)+
        (i.bad?' <span class="fix">'+C.h('w.prompt.fix',{fix:esc(i.fix)})+'</span>':'')+'</span>';
      ib.appendChild(d);
    });

    if (newRun){
      runs++; seen.add(body);
      $('#pRuns').textContent=runs; $('#pDistinct').textContent=seen.size;
      const v=$('#pVerdict');
      if (runs<3){ v.className='chip'; v.textContent=C.t('w.prompt.verdict.more'); }
      else if (seen.size===1){ v.className='chip ok'; v.textContent=C.t('w.prompt.verdict.tight'); }
      else { v.className='chip bad'; v.textContent=C.t('w.prompt.distinct',{n:seen.size}); }
    }
  }
  render(false);
  $('#pRuns').textContent=1; $('#pDistinct').textContent=1;
  seen.add($('#modelOut').textContent);
})();
/* ===================== 03 — THE AGENT LOOP ===================== */
(function(){
  const TRACE=[
    {think:C.t('w.loop.trace.s1.think'),tool:'read_inventory()',
     obs:C.t('w.loop.trace.s1.obs'),ok:true},
    {think:C.t('w.loop.trace.s2.think'),tool:'read_par_levels()',
     obs:C.t('w.loop.trace.s2.obs'),ok:false,
     note:C.t('w.loop.trace.s2.note')},
    {think:C.t('w.loop.trace.s3.think'),tool:'read_sales(days=7)',
     obs:C.t('w.loop.trace.s3.obs'),ok:true},
    {think:C.t('w.loop.trace.s4.think'),
     tool:'place_order("coffee_beans", 12)',obs:C.t('w.loop.trace.s4.obs'),ok:true},
    {think:C.t('w.loop.trace.s5.think'),tool:'place_order("cups_12oz", 500)',
     obs:C.t('w.loop.trace.s5.obs'),ok:false,
     note:C.t('w.loop.trace.s5.note')},
    {think:C.t('w.loop.trace.s6.think'),tool:'place_order("cups_12oz", 1000)',
     obs:C.t('w.loop.trace.s6.obs'),ok:true},
    {think:C.t('w.loop.trace.s7.think'),
     tool:'send_email(to="manager", body="Restock: 12kg beans, 1000 cups")',obs:C.t('w.loop.trace.s7.obs'),ok:true},
    {think:C.t('w.loop.trace.s8.think'),
     tool:null,obs:C.t('w.loop.trace.s8.obs'),ok:true,done:true}
  ];
  let idx=0, running=null, maxSteps=10, inFlight=false, finished=false, runToken=0, lfc=null;

  lfc=FC.draw($('#fcLoop'),{viewBox:'0 0 580 620',nodes:[
    {id:'start',type:'start',x:80,y:12,w:240,h:42,lines:[C.t('w.loop.fc.start')]},
    {id:'think',type:'model',x:80,y:88,w:240,h:46,lines:[C.t('w.loop.fc.think1'),C.t('w.loop.fc.think2')]},
    {id:'act',  type:'tool', x:80,y:168,w:240,h:46,lines:[C.t('w.loop.fc.act1'),C.t('w.loop.fc.act2')]},
    {id:'obs',  type:'proc', x:80,y:248,w:240,h:46,lines:[C.t('w.loop.fc.obs1'),C.t('w.loop.fc.obs2')]},
    {id:'d1',   type:'dec',  x:70,y:318,w:260,h:84,lines:[C.t('w.loop.fc.done')],fs:12},
    {id:'d2',   type:'dec',  x:64,y:428,w:272,h:84,lines:[C.t('w.loop.fc.limit1'),C.t('w.loop.fc.limit2')],fs:12},
    {id:'ok',   type:'start',x:376,y:339,w:186,h:42,lines:[C.t('w.loop.fc.ok')]},
    {id:'bad',  type:'err',  x:376,y:449,w:190,h:42,lines:[C.t('w.loop.fc.bad')]}
  ],edges:[
    {from:'start',to:'think'},{from:'think',to:'act'},{from:'act',to:'obs'},{from:'obs',to:'d1'},
    {from:'d1',to:'ok',fs:'e',ts:'w',kind:'yes',label:C.t('w.loop.fc.yes'),lx:352,ly:352},
    {from:'d1',to:'d2',kind:'no',label:C.t('w.loop.fc.no'),lx:216,ly:418},
    {from:'d2',to:'bad',fs:'e',ts:'w',kind:'yes',label:C.t('w.loop.fc.yes'),lx:354,ly:462},
    {from:'d2',to:'think',fs:'s',ts:'w',kind:'no',label:C.t('w.loop.again'),
     via:[{x:200,y:566},{x:26,y:566},{x:26,y:111}],lx:250,ly:586}
  ]});
  function fcDim(){
    Object.values(lfc.nodes).forEach(g=>{g.classList.add('dim');g.classList.remove('live','pulse');});
    Object.values(lfc.edges).forEach(p=>p.classList.add('dim'));
    Object.values(lfc.edges).forEach(p=>p.classList.remove('live'));
    Object.values(lfc.labels).forEach(t=>{t.classList.add('dim');t.classList.remove('live');});
  }
  function fcOn(ids,edges){
    fcDim();
    ids.forEach(i=>{ const g=lfc.nodes[i]; if(g){g.classList.remove('dim');g.classList.add('live');} });
    (edges||[]).forEach(k=>{
      const p=lfc.edges[k]; if(p){p.classList.remove('dim');p.classList.add('live');}
      const t=lfc.labels[k]; if(t){t.classList.remove('dim');t.classList.add('live');}
    });
  }
  fcDim();

  const log=$('#stepLog'), ctx=$('#ctxList');
  function reset(){
    runToken++; running=null;
    idx=0; inFlight=false; finished=false;
    log.innerHTML='<div class="mono-note">'+C.h('w.loop.hint')+'</div>';
    ctx.innerHTML='<div class="mono-note">'+C.h('w.loop.empty')+'</div>';
    $('#mSteps').textContent='0'; $('#mCalls').textContent='0'; $('#mCost').textContent='0';
    $('#mCostBox').classList.remove('alert');
    $('#lBanner').innerHTML=''; $('#lStatus').textContent=C.t('w.loop.status.idle');
    $('#lStep').disabled=false; $('#lRun').disabled=false;
    fcDim();
  }

  function pushStep(){
    if (idx>=TRACE.length) return true;
    if (idx>=maxSteps){
      $('#lBanner').innerHTML='<div class="banner warn">'+C.h('w.loop.stopped',{max:maxSteps})+'</div>';
      $('#lStatus').textContent=C.t('w.loop.status.limit');
      $('#lStep').disabled=true; $('#lRun').disabled=true;
      fcOn(['d2','bad'],['d2>bad']);
      return true;
    }
    if (idx===0) log.innerHTML='';
    const s=TRACE[idx], n=idx+1;
    const card=document.createElement('div');
    card.className='sl'+(s.done?' done':'');
    let h='<div class="sl-h"><span class="n">'+C.h('w.loop.step',{n:n})+'</span>'+(s.done?'<span>'+C.h('w.loop.finishedTag')+'</span>':'')+'</div>';
    h+='<div class="sl-row think"><span class="sl-k">'+C.h('w.loop.row.think')+'</span><span class="sl-v">'+esc(s.think)+'</span></div>';
    if (s.tool) h+='<div class="sl-row act"><span class="sl-k">'+C.h('w.loop.row.act')+'</span><span class="sl-v">'+esc(s.tool)+'</span></div>';
    h+='<div class="sl-row obs '+(s.ok?'good':'err')+'"><span class="sl-k">'+(s.done?C.h('w.loop.row.result'):C.h('w.loop.row.observe'))+
       '</span><span class="sl-v">'+(s.ok?'':'⚠ ')+esc(s.obs)+'</span></div>';
    if (!s.done) h+='<div class="sl-row"><span class="sl-k">'+C.h('w.loop.row.done')+'</span><span class="sl-v" style="color:var(--ink-3)">'+C.h('w.loop.again')+'</span></div>';
    if (s.note) h+='<div class="sl-row"><span class="sl-k">'+C.h('w.loop.row.note')+'</span><span class="sl-v" style="font-family:var(--serif);font-size:14.5px;color:var(--amber)">'+esc(s.note)+'</span></div>';
    card.innerHTML=h; log.appendChild(card); log.scrollTop=log.scrollHeight;

    if (ctx.querySelector('.mono-note')) ctx.innerHTML='';
    const c1=document.createElement('div'); c1.className='ci m';
    c1.textContent=n+'. 🤔 '+s.think.slice(0,38)+'…'; ctx.appendChild(c1);
    if (s.tool){ const c2=document.createElement('div'); c2.className='ci';
      c2.textContent=n+'. 👀 '+s.obs.slice(0,38)+'…'; ctx.appendChild(c2); }
    ctx.scrollTop=ctx.scrollHeight;

    idx++;
    const calls=TRACE.slice(0,idx).filter(t=>t.tool).length;
    const cost=idx*1400+(idx*(idx-1)/2)*260;
    $('#mSteps').textContent=idx; $('#mCalls').textContent=calls;
    $('#mCost').textContent=cost.toLocaleString();
    $('#mCostBox').classList.toggle('alert',idx>=6);
    $('#lStatus').textContent = s.done ? C.t('w.loop.status.finished') : C.t('w.loop.stepOf',{n:idx});

    if (s.done){
      fcOn(['d1','ok'],['d1>ok']);
      $('#lBanner').innerHTML='<div class="banner ok">'+C.h('w.loop.finished')+'</div>';
      $('#lStep').disabled=true; $('#lRun').disabled=true;
      return true;
    }
    fcOn(['obs','d1','d2','think'],['obs>d1','d1>d2','d2>think']);
    return false;
  }

  function stepAnimated(cb){
    // a queued tick must never restart the animation after the run has ended,
    // or it repaints the flowchart over the final "stopped" state
    if (finished){ cb&&cb(true); return; }
    if (RM){ const d=pushStep(); if(d) finished=true; cb&&cb(d); return; }
    inFlight=true;
    fcOn(['think'],[]);
    setTimeout(()=>{ fcOn(['think','act'],['think>act']);
      setTimeout(()=>{ const d=pushStep(); if(d) finished=true; inFlight=false; cb&&cb(d); },300);
    },300);
  }
  $('#lStep').addEventListener('click',()=>{ if(!running&&!inFlight&&!finished) stepAnimated(); });
  // chained, not setInterval: each step starts only once the previous one has
  // fully painted, so a queued tick can never repaint over the final state
  $('#lRun').addEventListener('click',()=>{
    if (running||inFlight||finished) return;
    running=true;
    const token=runToken;
    (function chain(){
      if (token!==runToken){ return; }
      stepAnimated(done=>{
        if (token!==runToken) return;
        if (done||finished){ running=null; return; }
        setTimeout(chain, RM?40:520);
      });
    })();
  });
  $('#lReset').addEventListener('click',reset);
  $('#lMax').addEventListener('input',e=>{ maxSteps=+e.target.value; $('#lMaxV').textContent=maxSteps; reset(); });
})();
/* ===================== 03 — CONTEXT ENGINEERING ===================== */
(function(){
  const LIMIT=8000, PRICE=3/1e6;   // $3 per million tokens, roughly
  const ITEMS=[
    {id:'sys',  n:C.t('w.context.item.sys.name'), tk:900,  w:'must', note:C.t('w.context.item.sys.note')},
    {id:'q',    n:C.t('w.context.item.q.name'),           tk:60,   w:'must', note:C.t('w.context.item.q.note')},
    {id:'ord',  n:C.t('w.context.item.ord.name'),                tk:180,  w:'good', note:C.t('w.context.item.ord.note')},
    {id:'pol',  n:C.t('w.context.item.pol.name'),        tk:420,  w:'good', note:C.t('w.context.item.pol.note')},
    {id:'sum',  n:C.t('w.context.item.sum.name'),        tk:260,  w:'good', note:C.t('w.context.item.sum.note')},
    {id:'last', n:C.t('w.context.item.last.name'),    tk:540,  w:'good', note:C.t('w.context.item.last.note')},
    {id:'hist', n:C.t('w.context.item.hist.name'),           tk:3400, w:'junk', note:C.t('w.context.item.hist.note')},
    {id:'cat',  n:C.t('w.context.item.cat.name'),      tk:5200, w:'junk', note:C.t('w.context.item.cat.note')},
    {id:'tick', n:C.t('w.context.item.tick.name'),     tk:2100, w:'junk', note:C.t('w.context.item.tick.note')},
    {id:'brand',n:C.t('w.context.item.brand.name'),          tk:1600, w:'junk', note:C.t('w.context.item.brand.note')}
  ];
  const on={}; ITEMS.forEach(i=>on[i.id]=false);

  /* --- flowchart: how something earns a place --- */
  FC.draw($('#fcContext'),{viewBox:'0 0 760 470',nodes:[
    {id:'s',  type:'start',x:250,y:12, w:260,h:42,lines:[C.t('w.context.fc.start')]},
    {id:'d1', type:'dec',  x:230,y:86, w:300,h:88,lines:[C.t('w.context.fc.rel1'),C.t('w.context.fc.rel2')],fs:12},
    {id:'out',type:'err',  x:590,y:108,w:160,h:44,lines:[C.t('w.context.fc.out')],fs:12},
    {id:'d2', type:'dec',  x:240,y:206,w:280,h:84,lines:[C.t('w.context.fc.fit')],fs:12},
    {id:'sh', type:'model',x:576,y:226,w:176,h:46,lines:[C.t('w.context.fc.shrink1'),C.t('w.context.fc.shrink2')],fs:11},
    {id:'add',type:'proc', x:270,y:322,w:220,h:44,lines:[C.t('w.context.fc.add')],fs:12},
    {id:'go', type:'start',x:250,y:398,w:260,h:42,lines:[C.t('w.context.fc.go')]}
  ],edges:[
    {from:'s',to:'d1'},
    {from:'d1',to:'out',fs:'e',ts:'w',kind:'no',label:C.t('w.context.fc.no'),lx:560,ly:118},
    {from:'d1',to:'d2',kind:'yes',label:C.t('w.context.fc.yes'),lx:404,ly:196},
    {from:'d2',to:'sh',fs:'e',ts:'w',kind:'no',label:C.t('w.context.fc.no'),lx:552,ly:238},
    {from:'d2',to:'add',kind:'yes',label:C.t('w.context.fc.yes'),lx:414,ly:312},
    {from:'sh',to:'add',fs:'s',ts:'e',via:[{x:664,y:344}],r:12},
    {from:'add',to:'go'}
  ]});

  const list=$('#packList');
  ITEMS.forEach(it=>{
    const b=document.createElement('button');
    b.className='pk'; b.type='button'; b.setAttribute('aria-pressed','false'); b.dataset.id=it.id;
    b.innerHTML='<span class="bx" aria-hidden="true">✓</span>'+
      '<span class="nm">'+esc(it.n)+'<span class="sub '+it.w+'">'+
      C.h('w.context.badge.'+it.w,{note:esc(it.note)})+'</span></span>'+
      '<span class="tk">'+it.tk.toLocaleString()+'</span>';
    b.addEventListener('click',()=>{ on[it.id]=!on[it.id]; paint(); });
    list.appendChild(b);
  });

  function paint(){
    const chosen=ITEMS.filter(i=>on[i.id]);
    const used=chosen.reduce((a,i)=>a+i.tk,0);
    const over=Math.max(0,used-LIMIT);
    const t={must:0,good:0,junk:0};
    chosen.forEach(i=>t[i.w]+=i.tk);
    const useful=t.must+t.good;
    const signal = used ? Math.round(useful/used*100) : 0;

    $$('.pk',list).forEach(b=>{
      b.setAttribute('aria-pressed',on[b.dataset.id]?'true':'false');
      b.classList.toggle('over',over>0&&on[b.dataset.id]);
    });

    // bar: fill by category, then a hatched overflow block
    const scale=w=>Math.min(100,w/Math.max(LIMIT,used)*100);
    $('#winBar').innerHTML =
      '<i class="must" style="width:'+scale(t.must)+'%"></i>'+
      '<i class="good" style="width:'+scale(t.good)+'%"></i>'+
      '<i class="junk" style="width:'+scale(t.junk)+'%"></i>'+
      // when you overflow, show WHERE the ceiling was — otherwise a full bar looks the same either way
      (over ? '<b class="lim" style="left:'+(LIMIT/used*100).toFixed(1)+'%"></b>' : '');
    $('#winUsed').textContent = C.t('w.context.used',{used:used.toLocaleString(),limit:LIMIT.toLocaleString()})+
      (over?C.t('w.context.over',{n:over.toLocaleString()}):'');
    $('#winUsed').style.color = over?'var(--red)':'var(--ink-3)';
    $('#winCost').textContent = C.t('w.context.cost',{usd:(used*PRICE).toFixed(4)});

    // quality: required parts are the floor, helpful parts add, noise actively subtracts
    const haveMust = ITEMS.filter(i=>i.w==='must').every(i=>on[i.id]);
    const goodOn   = ITEMS.filter(i=>i.w==='good'&&on[i.id]).length;
    const junkOn   = ITEMS.filter(i=>i.w==='junk'&&on[i.id]).length;
    let q = over ? 0 : (haveMust ? 22 + goodOn*17 - junkOn*9 : Math.max(0,10+goodOn*5-junkOn*5));
    q = Math.max(0,Math.min(100,q));

    $('#mSignal').textContent = signal+'%';
    $('#mSignal').style.color = signal>=80?'var(--green)':signal>=50?'var(--amber)':'var(--red)';
    $('#mQuality').textContent = q;
    $('#mQuality').style.color = q>=80?'var(--green)':q>=45?'var(--amber)':'var(--red)';
    $('#mSignal').parentElement.classList.toggle('alert',signal<50&&used>0);

    let v,out;
    if (over){
      v='<div class="banner bad">'+C.h('w.context.tooBig')+'</div>';
      out=C.t('w.context.out.tooBig');
    } else if (!haveMust){
      v='<div class="banner warn">'+C.h('w.context.missing')+'</div>';
      out=C.t('w.context.out.missing');
    } else if (junkOn>=2){
      v='<div class="banner bad">'+C.h('w.context.poor',{pct:signal})+'</div>';
      out=C.t('w.context.out.poor');
    } else if (q>=80){
      v='<div class="banner ok">'+C.h('w.context.good')+'</div>';
      out=C.t('w.context.out.good');
    } else {
      v='<div class="banner">'+C.h('w.context.thin')+'</div>';
      out=C.t('w.context.out.thin');
    }
    $('#packVerdict').innerHTML=v;
    $('#packOut').textContent=out;
  }
  $('#packAuto').addEventListener('click',()=>{ ITEMS.forEach(i=>on[i.id]=(i.w!=='junk')); paint(); });
  $('#packAll').addEventListener('click', ()=>{ ITEMS.forEach(i=>on[i.id]=true); paint(); });
  $('#packClear').addEventListener('click',()=>{ ITEMS.forEach(i=>on[i.id]=false); paint(); });
  paint();
})();

/* ===================== 04 — THE GRAPH ===================== */
(function(){
  const W=124,H=48;
  const N={
    intake: {x:10, y:226,lines:[C.t('w.graph.node.intake')],                 kind:'h',log:C.t('w.graph.node.intake.log')},
    router: {x:150,y:226,lines:[C.t('w.graph.node.router')],                 kind:'m',log:C.t('w.graph.node.router.log')},
    stock:  {x:340,y:50, lines:[C.t('w.graph.node.stock')],            kind:'h',log:C.t('w.graph.node.stock.log')},
    build:  {x:510,y:50, lines:[C.t('w.graph.node.build')],            kind:'h',log:C.t('w.graph.node.build.log')},
    faq:    {x:340,y:160,lines:[C.t('w.graph.node.faq')],             kind:'h',log:C.t('w.graph.node.faq.log')},
    answer: {x:510,y:160,lines:[C.t('w.graph.node.answer')],           kind:'m',log:C.t('w.graph.node.answer.log')},
    acct:   {x:340,y:270,lines:[C.t('w.graph.node.acct')],           kind:'h',log:C.t('w.graph.node.acct.log')},
    hist:   {x:340,y:340,lines:[C.t('w.graph.node.hist')],            kind:'h',log:C.t('w.graph.node.hist.log')},
    policy: {x:340,y:410,lines:[C.t('w.graph.node.policy')],          kind:'h',log:C.t('w.graph.node.policy.log')},
    apology:{x:510,y:340,lines:[C.t('w.graph.node.apology1'),C.t('w.graph.node.apology2')],kind:'m',log:C.t('w.graph.node.apology.log')},
    review: {x:720,y:226,lines:[C.t('w.graph.node.review')],               kind:'m',log:C.t('w.graph.node.review.log')},
    send:   {x:870,y:226,lines:[C.t('w.graph.node.send')],                   kind:'h',log:C.t('w.graph.node.send.log')}
  };
  const EDGES=[['intake','router',''],['router','stock',''],['router','faq',''],['router','acct',''],
    ['router','hist',''],['router','policy',''],['stock','build',''],['faq','answer',''],
    ['acct','apology',''],['hist','apology',''],['policy','apology',''],
    ['build','review',''],['answer','review',''],['apology','review',''],['review','send',C.t('w.graph.edge.approved'),-34]];
  const BACK={
    build:  'M782,226 C782,190 782,20 700,20 C640,20 572,20 572,50',
    answer: 'M782,274 C782,300 700,310 640,310 C600,310 572,310 572,208',
    apology:'M782,274 C782,400 782,482 700,482 C640,482 572,482 572,388'
  };
  const svg=$('#graphSvg'), nodeEls={}, edgeEls={}, backEls={}, labelEls={};
  (function build(){
    svg.innerHTML='';
    const defs=el('defs');
    [['ga','var(--line-2)'],['gb','var(--red)'],['gc','var(--violet)']].forEach(([id,c])=>{
      const m=el('marker',{id:id,viewBox:'0 0 9 9',refX:'7.5',refY:'4.5',markerWidth:'5.5',markerHeight:'5.5',orient:'auto-start-reverse'});
      m.appendChild(el('path',{d:'M0,0 L9,4.5 L0,9 z',fill:c})); defs.appendChild(m);
    });
    svg.appendChild(defs);
    [[C.t('w.graph.lane.order'),34,'var(--blue)'],[C.t('w.graph.lane.question'),144,'var(--teal)'],[C.t('w.graph.lane.complaint'),254,'var(--magenta)']].forEach(([t,y,c])=>{
      const e=el('text',{x:340,y:y,class:'g-lane',fill:c}); e.appendChild(txt(t)); svg.appendChild(e);
    });
    Object.keys(BACK).forEach(k=>{ const p=el('path',{d:BACK[k],class:'g-edge back','marker-end':'url(#gb)'}); svg.appendChild(p); backEls[k]=p; });
    const bl=el('text',{x:640,y:474,class:'g-elabel backlabel'});
    bl.appendChild(txt(C.t('w.graph.backLabel'))); svg.appendChild(bl); backEls.__label=bl;
    EDGES.forEach(([a,b,lab,dy])=>{
      const A=N[a],B=N[b];
      const x1=A.x+W,y1=A.y+H/2,x2=B.x,y2=B.y+H/2;
      const dx=Math.max(28,(x2-x1)*0.55);
      const p=el('path',{d:'M'+x1+','+y1+' C'+(x1+dx)+','+y1+' '+(x2-dx)+','+y2+' '+x2+','+y2,
        class:'g-edge','marker-end':'url(#ga)'});
      svg.appendChild(p); edgeEls[a+'>'+b]=p;
      if (lab){
        const t=el('text',{x:(x1+x2)/2,y:(y1+y2)/2+(dy===undefined?-6:dy),class:'g-elabel'});
        t.appendChild(txt(lab)); svg.appendChild(t); labelEls[a+'>'+b]=t;
      }
    });
    Object.keys(N).forEach(k=>{
      const n=N[k];
      const g=el('g',{class:'g-node'+(n.kind==='m'?' model':'')});
      g.appendChild(el('rect',{x:n.x,y:n.y,width:W,height:H,rx:'7'}));
      const cy=n.y+H/2+(n.lines.length>1?-3:4);
      n.lines.forEach((ln,i)=>{ const t=el('text',{x:n.x+W/2,y:cy+i*14}); t.appendChild(txt(ln)); g.appendChild(t); });
      svg.appendChild(g); nodeEls[k]=g;
    });
  })();

  function clearGraph(){
    Object.values(nodeEls).forEach(g=>g.classList.remove('live','fired','skipped'));
    Object.values(edgeEls).forEach(p=>p.classList.remove('live'));
    Object.values(labelEls).forEach(p=>p.classList.remove('live'));
    Object.keys(BACK).forEach(k=>backEls[k].classList.remove('live'));
    backEls.__label.classList.remove('live');
    $('#gLog').innerHTML='<div class="mono-note">'+C.h('w.graph.logEmpty')+'</div>';
    $('#gResultBox').innerHTML='<div class="mono-note">'+C.h('w.graph.resultEmpty')+'</div>';
  }
  const CASES={
    order:{label:C.t('w.graph.case.order.label'),msg:C.t('w.graph.case.order.msg'),lane:['stock','build'],
      result:{text:C.t('w.graph.case.order.result')}},
    question:{label:C.t('w.graph.case.question.label'),msg:C.t('w.graph.case.question.msg'),lane:['faq','answer'],
      result:{text:C.t('w.graph.case.question.result')}},
    complaint:{label:C.t('w.graph.case.complaint.label'),msg:C.t('w.graph.case.complaint.msg'),lane:['__p','apology'],reject:true,
      result:{text:C.t('w.graph.case.complaint.result')},
      resultNoReview:{text:C.t('w.graph.case.complaint.resultNoReview')}}
  };
  let parallel=true, reviewer=true, playing=false, clock=0;
  const gb=$('#gButtons');
  Object.keys(CASES).forEach(k=>{
    const c=CASES[k], b=document.createElement('button');
    b.className='btn'; b.type='button';
    b.innerHTML='<strong>'+c.label+'</strong> &nbsp;“'+esc(c.msg)+'”';
    b.addEventListener('click',()=>play(k)); gb.appendChild(b);
  });
  $('#gPar').addEventListener('click',function(){
    parallel=!parallel; this.setAttribute('aria-pressed',parallel);
    this.textContent=C.t('w.graph.lookups',{mode:C.t(parallel?'w.graph.lookups.parallel':'w.graph.lookups.serial')});
    this.classList.toggle('sel',parallel);
    $$('.tb')[1].querySelector('.bar span').style.width = parallel?'39%':'100%';
  });
  $('#gRev').addEventListener('click',function(){
    reviewer=!reviewer; this.setAttribute('aria-pressed',reviewer);
    this.textContent=C.t('w.graph.reviewer',{state:C.t(reviewer?'w.graph.reviewer.on':'w.graph.reviewer.off')});
    this.classList.toggle('sel',reviewer); this.classList.toggle('ghost',!reviewer);
  });
  $('#gReset').addEventListener('click',clearGraph);

  function logLine(kind,name,text){
    const box=$('#gLog');
    if (box.querySelector('.mono-note')) box.innerHTML='';
    const d=document.createElement('div'); d.className='gl '+kind;
    d.innerHTML='<span class="t">'+C.h('w.graph.clock',{s:clock.toFixed(1)})+'</span><span><span class="n">'+esc(name)+'</span> — '+esc(text)+'</span>';
    box.appendChild(d); box.scrollTop=box.scrollHeight;
  }
  function fire(keys,dur,say){
    keys.forEach(k=>{
      nodeEls[k].classList.add('live','fired');
      const line=(say===undefined)?N[k].log:say;
      if (line) logLine(N[k].kind==='m'?'m':'h',N[k].lines.join(' '),line);
    });
    clock+=dur;
  }
  function lightEdge(a,b){
    const p=edgeEls[a+'>'+b]; if(p) p.classList.add('live');
    const l=labelEls[a+'>'+b]; if(l) l.classList.add('live');
  }
  function finish(res,ok){
    const box=$('#gResultBox'); box.innerHTML='';
    const d=document.createElement('div'); d.className='msgcard '+(ok?'ok':'bad');
    d.textContent=res.text; box.appendChild(d);
    const n=document.createElement('div'); n.style.marginTop='10px'; n.className='mono-note';
    n.innerHTML = ok
      ? C.h('w.graph.note.ok')
      : '<span style="color:var(--red)">'+C.h('w.graph.note.bad')+'</span>';
    box.appendChild(n);
  }
  function play(key){
    if (playing) return;
    playing=true; clearGraph(); clock=0;
    const c=CASES[key], gap=RM?0:640, seq=[];
    seq.push(()=>fire(['intake'],0.1));
    seq.push(()=>{ lightEdge('intake','router');
      fire(['router'],0.4,C.t('w.graph.routed',{lane:c.label.replace(/^\S+\s/,'').toLowerCase()})); });
    if (key==='complaint'){
      seq.push(()=>{
        ['acct','hist','policy'].forEach(k=>lightEdge('router',k));
        if (parallel){ fire(['acct','hist','policy'],1.1); logLine('h','—',C.t('w.graph.sideBySide')); }
        else { fire(['acct'],0.9); fire(['hist'],1.1); fire(['policy'],0.8); logLine('h','—',C.t('w.graph.oneAfterAnother')); }
      });
      seq.push(()=>{ ['acct','hist','policy'].forEach(k=>lightEdge(k,'apology')); fire(['apology'],0.9); });
    } else {
      const [a,b]=c.lane;
      seq.push(()=>{ lightEdge('router',a); fire([a],0.5); });
      seq.push(()=>{ lightEdge(a,b); fire([b],0.8); });
    }
    const draft = key==='complaint' ? 'apology' : c.lane[1];
    if (reviewer){
      seq.push(()=>{ lightEdge(draft,'review'); fire(['review'],0.5); });
      if (c.reject){
        seq.push(()=>{
          const LBL={build:[640,14],answer:[664,304],apology:[640,476]};
          const pos=LBL[draft]||LBL.apology;
          backEls.__label.setAttribute('x',pos[0]); backEls.__label.setAttribute('y',pos[1]);
          backEls[draft].classList.add('live'); backEls.__label.classList.add('live');
          nodeEls.review.classList.remove('live');
          logLine('r',C.t('w.graph.reviewerName'),C.t('w.graph.rejected'));
          clock+=0.3;
        });
        seq.push(()=>fire([draft],0.8,C.t('w.graph.rewrote')));
        seq.push(()=>fire(['review'],0.5,C.t('w.graph.approvedSecond')));
      } else {
        seq.push(()=>{ logLine('m',C.t('w.graph.reviewerName'),C.t('w.graph.approvedFirst')); clock+=0.1; });
      }
      seq.push(()=>{ lightEdge('review','send'); fire(['send'],0.2); finish(c.result,true); });
    } else {
      seq.push(()=>{
        nodeEls.review.classList.add('skipped');
        logLine('r',C.t('w.graph.reviewerName'),C.t('w.graph.skipped'));
        lightEdge(draft,'review'); lightEdge('review','send');
        fire(['send'],0.2);
        finish(key==='complaint'?c.resultNoReview:c.result, key!=='complaint');
      });
    }
    let i=0;
    (function next(){ if(i>=seq.length){playing=false;return;} seq[i++](); setTimeout(next,gap); })();
  }
})();

/* ===================== 06 — HARNESS ENGINEERING ===================== */
(function(){
  FC.strip($('#stripHarness'),
    [[C.t('w.harness.strip.s1'),C.t('w.harness.strip.s1sub')],[C.t('w.harness.strip.s2'),C.t('w.harness.strip.s2sub')],
     [C.t('w.harness.strip.s3'),C.t('w.harness.strip.s3sub')],[C.t('w.harness.strip.s4'),C.t('w.harness.strip.s4sub')]],
    C.t('w.harness.strip.back'));

  /* the picture that matters: the model is one small box inside your program */
  FC.draw($('#fcHarness'),{viewBox:'0 0 960 664',nodes:[
    {id:'req', type:'start',x:370,y:6,  w:220,h:34,lines:[C.t('w.harness.fc.req')],fs:11.5},
    {id:'ctx', type:'proc', x:370,y:98, w:220,h:46,lines:[C.t('w.harness.fc.ctx')],fs:11.5},
    {id:'mdl', type:'model',x:390,y:168,w:180,h:48,lines:[C.t('w.harness.fc.mdl1'),C.t('w.harness.fc.mdl2')],fs:11.5},
    {id:'d1',  type:'dec',  x:340,y:240,w:280,h:84,lines:[C.t('w.harness.fc.ask1'),C.t('w.harness.fc.ask2')],fs:12},
    {id:'ret', type:'start',x:700,y:260,w:224,h:44,lines:[C.t('w.harness.fc.ret')],fs:11.5},
    {id:'gate',type:'dec',  x:330,y:352,w:300,h:88,lines:[C.t('w.harness.fc.gate1'),C.t('w.harness.fc.gate2')],fs:12},
    {id:'no',  type:'err',  x:60, y:374,w:220,h:44,lines:[C.t('w.harness.fc.refuse')],fs:11.5},
    {id:'run', type:'tool', x:350,y:468,w:260,h:48,lines:[C.t('w.harness.fc.run')],fs:11.5},
    {id:'crash',type:'dec', x:340,y:536,w:280,h:84,lines:[C.t('w.harness.fc.crash1'),C.t('w.harness.fc.crash2')],fs:12},
    {id:'err', type:'err',  x:60, y:556,w:220,h:44,lines:[C.t('w.harness.fc.errNode')],fs:11},
    {id:'log', type:'proc', x:60, y:468,w:220,h:48,lines:[C.t('w.harness.fc.log')],fs:11.5}
  ],edges:[
    {from:'req',to:'ctx'},{from:'ctx',to:'mdl'},{from:'mdl',to:'d1'},
    {from:'d1',to:'ret',fs:'e',ts:'w',kind:'yes',label:C.t('w.harness.fc.anAnswer'),lx:664,ly:272},
    {from:'d1',to:'gate',kind:'no',label:C.t('w.harness.fc.aTool'),lx:508,ly:342},
    {from:'gate',to:'no',fs:'w',ts:'e',kind:'no',label:C.t('w.harness.fc.no'),lx:302,ly:386},
    {from:'gate',to:'run',kind:'yes',label:C.t('w.harness.fc.yes'),lx:508,ly:458},
    {from:'run',to:'crash'},
    {from:'crash',to:'err',fs:'w',ts:'e',kind:'no',label:C.t('w.harness.fc.yes'),lx:312,ly:568},
    {from:'crash',to:'log',fs:'w',ts:'e',kind:'yes',label:C.t('w.harness.fc.no'),via:[{x:310,y:578},{x:310,y:492}],lx:250,ly:534},
    {from:'no',to:'log',fs:'s',ts:'n'},{from:'err',to:'log',fs:'n',ts:'s'},
    {from:'log',to:'ctx',fs:'w',ts:'w',via:[{x:30,y:492},{x:30,y:121}],label:C.t('w.harness.fc.tell'),lx:200,ly:112}
  ],captions:[
    {t:C.t('w.harness.fc.caption'),x:22,y:64}
  ]});
  // a frame round everything the harness owns, so the model reads as one box inside it
  (function(){
    const svg=$('#fcHarness');
    const box=el('rect',{x:14,y:72,width:932,height:568,rx:14,fill:'none',
      stroke:'var(--steel)','stroke-width':2,'stroke-dasharray':'9 6',opacity:'.65'});
    svg.insertBefore(box, svg.firstChild.nextSibling);
  })();

  const PARTS=[
    {id:'gate',   e:'🛡️',n:C.t('w.harness.part.gate.name'),w:30,
     d:C.t('w.harness.part.gate.desc'),
     f:C.t('w.harness.part.gate.fail')},
    {id:'retry',  e:'🔁',n:C.t('w.harness.part.retry.name'),w:18,
     d:C.t('w.harness.part.retry.desc'),
     f:C.t('w.harness.part.retry.fail')},
    {id:'errors', e:'🧯',n:C.t('w.harness.part.errors.name'),w:16,
     d:C.t('w.harness.part.errors.desc'),
     f:C.t('w.harness.part.errors.fail')},
    {id:'save',   e:'💾',n:C.t('w.harness.part.save.name'),w:14,
     d:C.t('w.harness.part.save.desc'),
     f:C.t('w.harness.part.save.fail')},
    {id:'timeout',e:'⏱️',n:C.t('w.harness.part.timeout.name'),w:12,
     d:C.t('w.harness.part.timeout.desc'),
     f:C.t('w.harness.part.timeout.fail',{tool:'read_sales()'})},
    {id:'log',    e:'📝',n:C.t('w.harness.part.log.name'),w:10,
     d:C.t('w.harness.part.log.desc'),
     f:C.t('w.harness.part.log.fail')}
  ];
  const on={}; PARTS.forEach(p=>on[p.id]=true);
  let nights=0;

  const box=$('#hToggles');
  PARTS.forEach(p=>{
    const b=document.createElement('button');
    b.className='tg'; b.type='button'; b.setAttribute('aria-pressed','true'); b.dataset.id=p.id;
    b.innerHTML='<span class="sw" aria-hidden="true"></span><span><span class="nm">'+p.e+' '+esc(p.n)+
      '</span><span class="ds">'+esc(p.d)+'</span></span>';
    b.addEventListener('click',()=>{ on[p.id]=!on[p.id]; sync(); });
    box.appendChild(b);
  });
  function sync(){ $$('.tg',box).forEach(b=>b.setAttribute('aria-pressed',on[b.dataset.id]?'true':'false')); }
  $('#hAll').addEventListener('click',()=>{PARTS.forEach(p=>on[p.id]=true);sync();});
  $('#hNone').addEventListener('click',()=>{PARTS.forEach(p=>on[p.id]=false);sync();});

  $('#hRun').addEventListener('click',()=>{
    nights++;
    const missing=PARTS.filter(p=>!on[p.id]);
    const rel=Math.max(0,100-missing.reduce((a,p)=>a+p.w,0));
    $('#hRuns').textContent=nights;
    $('#hInc').textContent=missing.length;
    $('#hRel').textContent=rel;
    $('#hRel').style.color = rel>=85?'var(--green)':rel>=55?'var(--amber)':'var(--red)';
    $('#hRelBox').classList.toggle('alert',rel<85);

    let v;
    if (!missing.length) v='<div class="banner ok">'+C.h('w.harness.ok')+'</div>';
    else if (rel>=70)    v='<div class="banner warn">'+C.h(C.p('w.harness.lucky',missing.length),{n:missing.length})+'</div>';
    else if (rel>=40)    v='<div class="banner bad">'+C.h('w.harness.bad')+'</div>';
    else                 v='<div class="banner bad">'+C.h('w.harness.demo')+'</div>';
    $('#hVerdict').innerHTML=v;
    $('#hIncidents').innerHTML = missing.map(p=>
      '<div class="incident"><span class="ic">'+p.e+'</span><span>'+C.h('w.harness.incident',{name:esc(p.n),fix:esc(p.f)})+'</span></div>').join('');
  });
  $('#hVerdict').innerHTML='<div class="banner">'+C.h('w.harness.idle')+'</div>';
})();

/* ===================== 07 — EVALUATION ===================== */
(function(){
  FC.strip($('#stripEvals'),
    [[C.t('w.evals.strip.s1'),C.t('w.evals.strip.s1sub')],[C.t('w.evals.strip.s2'),C.t('w.evals.strip.s2sub')],
     [C.t('w.evals.strip.s3'),C.t('w.evals.strip.s3sub')],[C.t('w.evals.strip.s4'),C.t('w.evals.strip.s4sub')]],
    C.t('w.evals.strip.back'));

  FC.draw($('#fcEvals'),{viewBox:'0 0 940 650',nodes:[
    {id:'chg', type:'start',x:350,y:8,  w:240,h:40,lines:[C.t('w.evals.fc.chg')],fs:11.5},
    {id:'set', type:'proc', x:340,y:92, w:260,h:46,lines:[C.t('w.evals.fc.set')],fs:11},
    {id:'sys', type:'model',x:360,y:164,w:220,h:46,lines:[C.t('w.evals.fc.sys')],fs:11.5},
    {id:'how', type:'dec',  x:320,y:236,w:300,h:86,lines:[C.t('w.evals.fc.how1'),C.t('w.evals.fc.how2')],fs:12},
    {id:'rule',type:'proc', x:20, y:256,w:230,h:46,lines:[C.t('w.evals.fc.rule1'),C.t('w.evals.fc.rule2')],fs:10.5},
    {id:'jdg', type:'model',x:690,y:256,w:230,h:46,lines:[C.t('w.evals.fc.jdg1'),C.t('w.evals.fc.jdg2')],fs:10.5},
    {id:'rate',type:'proc', x:340,y:346,w:260,h:46,lines:[C.t('w.evals.fc.rate')],fs:11.5},
    {id:'cmp', type:'dec',  x:320,y:414,w:300,h:86,lines:[C.t('w.evals.fc.cmp1'),C.t('w.evals.fc.cmp2')],fs:12},
    {id:'nope',type:'err',  x:36, y:436,w:230,h:44,lines:[C.t('w.evals.fc.nope')],fs:11.5},
    {id:'big', type:'dec',  x:320,y:530,w:300,h:86,lines:[C.t('w.evals.fc.big1'),C.t('w.evals.fc.big2')],fs:12},
    {id:'noise',type:'err', x:660,y:552,w:260,h:46,lines:[C.t('w.evals.fc.noise1'),C.t('w.evals.fc.noise2')],fs:10.5},
    {id:'ship',type:'start',x:36, y:552,w:230,h:44,lines:[C.t('w.evals.fc.ship')],fs:11.5}
  ],edges:[
    {from:'chg',to:'set'},{from:'set',to:'sys'},{from:'sys',to:'how'},
    {from:'how',to:'rule',fs:'w',ts:'e',label:C.t('w.evals.fc.exact'),lx:285,ly:270},
    {from:'how',to:'jdg',fs:'e',ts:'w',label:C.t('w.evals.fc.judgement'),lx:655,ly:270},
    {from:'rule',to:'rate',fs:'s',ts:'w',via:[{x:135,y:369}],r:12},
    {from:'jdg',to:'rate',fs:'s',ts:'e',via:[{x:805,y:369}],r:12},
    {from:'rate',to:'cmp'},
    {from:'cmp',to:'nope',fs:'w',ts:'e',kind:'no',label:C.t('w.evals.fc.no'),lx:293,ly:448},
    {from:'cmp',to:'big',kind:'yes',label:C.t('w.evals.fc.yes'),lx:492,ly:520},
    {from:'big',to:'noise',fs:'e',ts:'w',kind:'no',label:C.t('w.evals.fc.no'),lx:640,ly:564},
    {from:'big',to:'ship',fs:'w',ts:'e',kind:'yes',label:C.t('w.evals.fc.yes'),lx:293,ly:564}
  ]});

  // 20 cases: 12 checked by an exact rule, 8 by a judge model
  const CASES=[C.t('w.evals.case1'),C.t('w.evals.case2'),C.t('w.evals.case3'),C.t('w.evals.case4'),C.t('w.evals.case5'),
    C.t('w.evals.case6'),C.t('w.evals.case7'),C.t('w.evals.case8'),C.t('w.evals.case9'),C.t('w.evals.case10'),
    C.t('w.evals.case11'),C.t('w.evals.case12'),C.t('w.evals.case13'),C.t('w.evals.case14'),C.t('w.evals.case15'),
    C.t('w.evals.case16'),C.t('w.evals.case17'),C.t('w.evals.case18'),C.t('w.evals.case19'),C.t('w.evals.case20')];
  const JUDGED=new Set([3,7,8,13,15,16,19,11]);           // "good" is a judgement call here
  // 15 of 20 pass at baseline; the five failures are the vague, judgement-call orders
  const BASE=CASES.map((_,i)=>[3,7,8,13,16].indexOf(i)===-1?1:0);
  const CHANGES=[
    {id:'base',   n:C.t('w.evals.change.base'),      fix:[],            noise:0},
    {id:'examples',n:C.t('w.evals.change.examples'),   fix:[3,7,16],      noise:0},
    {id:'rules',  n:C.t('w.evals.change.rules'),   fix:[7,13],        noise:0},
    {id:'reword', n:C.t('w.evals.change.reword'),        fix:[],            noise:1},   // genuinely neutral
    {id:'cheaper',n:C.t('w.evals.change.cheaper'),  fix:[], breaks:[0,4,10,17], noise:0}
  ];
  let current='base', prev=15, runs=0;

  const cbox=$('#evChanges');
  CHANGES.forEach(c=>{
    const b=document.createElement('button');
    b.className='btn'+(c.id==='base'?' sel':''); b.type='button'; b.textContent=c.n; b.dataset.id=c.id;
    b.addEventListener('click',()=>{ current=c.id;
      $$('.btn',cbox).forEach(x=>x.classList.toggle('sel',x.dataset.id===c.id)); });
    cbox.appendChild(b);
  });

  function grid(res){
    const g=$('#evGrid'); g.innerHTML='';
    CASES.forEach((n,i)=>{
      const d=document.createElement('div');
      d.className='ev '+(res===null?'':(res[i]?'pass':'fail'))+(JUDGED.has(i)?' judge':'');
      d.title=C.t(JUDGED.has(i)?'w.evals.tip.judge':'w.evals.tip.rule',{name:n});
      d.textContent=res===null?'':(res[i]?'✓':'✗');
      g.appendChild(d);
    });
  }
  grid(null);

  $('#evRun').addEventListener('click',()=>{
    const c=CHANGES.find(x=>x.id===current);
    const res=BASE.slice();
    (c.fix||[]).forEach(i=>res[i]=1);
    (c.breaks||[]).forEach(i=>res[i]=0);
    // a genuinely neutral change still wobbles a case or two between runs — that is the lesson
    if (c.noise){
      const flip=[2,8,12,16][runs%4];   // pass,fail,pass,fail -> delta wobbles -1,+1,-1,+1
      res[flip]=res[flip]?0:1;
    }
    runs++;
    const score=res.reduce((a,b)=>a+b,0), delta=score-prev;
    grid(res);
    $('#evLabel').textContent=c.n.replace(/^\S+\s/,'');
    $('#evNow').textContent=C.t('w.evals.score',{n:score});
    $('#evPrev').textContent=C.t('w.evals.score',{n:prev});
    $('#evDelta').textContent=(delta>0?'+':'')+delta;
    $('#evDelta').style.color = delta>=2?'var(--green)':delta<=-2?'var(--red)':'var(--ink-3)';
    $('#evDeltaBox').classList.toggle('alert',Math.abs(delta)===1);

    let v;
    if (delta>=2)      v='<div class="banner ok">'+C.h('w.evals.better',{n:delta})+'</div>';
    else if (delta<=-2)v='<div class="banner bad">'+C.h('w.evals.worse',{n:-delta})+'</div>';
    else if (delta===0)v='<div class="banner">'+C.h('w.evals.flat')+'</div>';
    else               v='<div class="banner warn">'+C.h('w.evals.noise')+'</div>';
    $('#evVerdict').innerHTML=v;
    const failed=CASES.filter((_,i)=>!res[i]);
    $('#evFails').innerHTML = failed.length
      ? C.h('w.evals.stillFailing',{list:failed.map(esc).join(' · ')})
      : C.h('w.evals.allPass');
  });
  $('#evReset').addEventListener('click',()=>{
    current='base'; prev=15; runs=0;
    $$('.btn',cbox).forEach(x=>x.classList.toggle('sel',x.dataset.id==='base'));
    grid(null);
    $('#evNow').textContent='—'; $('#evPrev').textContent=C.t('w.evals.score',{n:15}); $('#evDelta').textContent='—';
    $('#evDelta').style.color=''; $('#evDeltaBox').classList.remove('alert');
    $('#evLabel').textContent=C.t('w.evals.label.baseline'); $('#evFails').innerHTML='';
    $('#evVerdict').innerHTML='<div class="banner">'+C.h('w.evals.idle')+'</div>';
  });
  $('#evVerdict').innerHTML='<div class="banner">'+C.h('w.evals.idle')+'</div>';
})();

/* ===================== 08 — SECURITY ===================== */
(function(){
  FC.strip($('#stripSecurity'),
    [[C.t('w.security.strip.s1'),C.t('w.security.strip.s1sub')],[C.t('w.security.strip.s2'),C.t('w.security.strip.s2sub')],
     [C.t('w.security.strip.s3'),C.t('w.security.strip.s3sub')],[C.t('w.security.strip.s4'),C.t('w.security.strip.s4sub')]],
    C.t('w.security.strip.back'));

  FC.draw($('#fcSecurity'),{viewBox:'0 0 940 400',nodes:[
    {id:'user',type:'start',x:20, y:36, w:230,h:48,lines:[C.t('w.security.fc.user')],fs:12},
    {id:'web', type:'err',  x:20, y:140,w:230,h:42,lines:[C.t('w.security.fc.web')],fs:11.5},
    {id:'mail',type:'err',  x:20, y:192,w:230,h:42,lines:[C.t('w.security.fc.mail')],fs:11.5},
    {id:'file',type:'err',  x:20, y:244,w:230,h:42,lines:[C.t('w.security.fc.file')],fs:11.5},
    {id:'ins', type:'proc', x:300,y:36, w:240,h:48,lines:[C.t('w.security.fc.ins1'),C.t('w.security.fc.ins2')],fs:11},
    {id:'dat', type:'tool', x:300,y:190,w:240,h:48,lines:[C.t('w.security.fc.dat1'),C.t('w.security.fc.dat2')],fs:11},
    {id:'mdl', type:'model',x:620,y:90, w:200,h:48,lines:[C.t('w.security.fc.mdl')],fs:11.5},
    {id:'gate',type:'dec',  x:585,y:196,w:270,h:96,lines:[C.t('w.security.fc.gate1'),C.t('w.security.fc.gate2')],fs:10.5},
    {id:'do',  type:'start',x:605,y:340,w:230,h:44,lines:[C.t('w.security.fc.do')],fs:11.5},
    {id:'stop',type:'err',  x:300,y:318,w:240,h:44,lines:[C.t('w.security.fc.stop')],fs:11.5}
  ],edges:[
    {from:'user',to:'ins',fs:'e',ts:'w',label:C.t('w.security.fc.orders'),lx:275,ly:54},
    {from:'web', to:'dat',fs:'e',ts:'w',via:[{x:275,y:161},{x:275,y:214}]},
    {from:'mail',to:'dat',fs:'e',ts:'w'},
    {from:'file',to:'dat',fs:'e',ts:'w',via:[{x:275,y:265},{x:275,y:214}]},
    {from:'ins',to:'mdl',fs:'e',ts:'w',via:[{x:580,y:60},{x:580,y:114}]},
    {from:'dat',to:'mdl',fs:'e',ts:'w',via:[{x:580,y:214},{x:580,y:114}]},
    {from:'mdl',to:'gate',label:C.t('w.security.fc.wantsToAct'),lx:790,ly:172},
    {from:'gate',to:'do',kind:'yes',label:C.t('w.security.fc.yes'),lx:750,ly:322},
    {from:'gate',to:'stop',fs:'w',ts:'e',kind:'no',label:C.t('w.security.fc.no'),via:[{x:562,y:244},{x:562,y:340}],lx:572,ly:288}
  ],captions:[
    {t:C.t('w.security.fc.trusted'),x:20,y:22},
    {t:C.t('w.security.fc.untrusted'),x:20,y:124}
  ]});

  const EMAIL_TOP=C.t('w.security.email.top');
  const EMAIL_INJ=C.t('w.security.email.injection');
  $('#secEmail').innerHTML='<span class="ok">'+esc(EMAIL_TOP)+'</span><span class="inj">'+esc(EMAIL_INJ)+'</span>'+
    '<div class="mono-note" style="margin-top:10px">'+C.h('w.security.email.note')+'</div>';

  const DEF=[
    {id:'label', e:'🏷️',n:C.t('w.security.def.label.name'),
     d:C.t('w.security.def.label.desc')},
    {id:'privilege',e:'🔑',n:C.t('w.security.def.privilege.name'),
     d:C.t('w.security.def.privilege.desc')},
    {id:'confirm',e:'🛡️',n:C.t('w.security.def.confirm.name'),
     d:C.t('w.security.def.confirm.desc')},
    {id:'egress', e:'🚧',n:C.t('w.security.def.egress.name'),
     d:C.t('w.security.def.egress.desc')}
  ];
  const on={}; DEF.forEach(d=>on[d.id]=true);
  const box=$('#secToggles');
  DEF.forEach(d=>{
    const b=document.createElement('button');
    b.className='tg'; b.type='button'; b.setAttribute('aria-pressed','true'); b.dataset.id=d.id;
    b.innerHTML='<span class="sw" aria-hidden="true"></span><span><span class="nm">'+d.e+' '+esc(d.n)+
      '</span><span class="ds">'+esc(d.d)+'</span></span>';
    b.addEventListener('click',()=>{on[d.id]=!on[d.id];sync();});
    box.appendChild(b);
  });
  function sync(){ $$('.tg',box).forEach(b=>b.setAttribute('aria-pressed',on[b.dataset.id]?'true':'false')); }
  $('#secAll').addEventListener('click',()=>{DEF.forEach(d=>on[d.id]=true);sync();});
  $('#secNone').addEventListener('click',()=>{DEF.forEach(d=>on[d.id]=false);sync();});

  $('#secRun').addEventListener('click',()=>{
    const acts=[];
    // the model is fooled unless the text was labelled as data; the other three cap the damage
    const fooled=!on.label;
    let money=18.60, leaked=0;
    if (fooled){
      if (on.privilege){ acts.push(['ok',C.t('w.security.act.capped')]); }
      else if (on.confirm){ acts.push(['ok',C.t('w.security.act.held')]); }
      else { money=4210; acts.push(['bad',C.t('w.security.act.refunded')]); }
      if (on.egress){ acts.push(['ok',C.t('w.security.act.blocked')]); }
      else { leaked=1284; acts.push(['bad',C.t('w.security.act.leaked')]); }
      acts.unshift(['bad',C.t('w.security.act.obeyed')]);
    } else {
      acts.push(['ok',C.t('w.security.act.quoted')]);
      acts.push(['ok',C.t('w.security.act.refund')]);
      acts.push(['ok',C.t('w.security.act.flagged')]);
    }
    $('#secMoney').textContent=C.t('w.security.money',{usd:money.toLocaleString(undefined,{minimumFractionDigits:2})});
    $('#secLeak').textContent=leaked?leaked.toLocaleString():'0';
    $('#secMoneyBox').classList.toggle('alert',money>18.60);
    $('#secLeakBox').classList.toggle('alert',leaked>0);
    $('#secMoney').style.color = money>18.60?'var(--red)':'var(--green)';
    $('#secLeak').style.color  = leaked>0?'var(--red)':'var(--green)';

    let v;
    if (!fooled) v='<div class="banner ok">'+C.h('w.security.verdict.handled')+'</div>';
    else if (money>18.60||leaked) v='<div class="banner bad">'+C.h('w.security.verdict.takenOver')+'</div>';
    else v='<div class="banner warn">'+C.h('w.security.verdict.cheap')+'</div>';
    $('#secVerdict').innerHTML=v;
    $('#secActions').innerHTML=acts.map(([k,t])=>
      '<div class="incident'+(k==='ok'?' safe':'')+'"><span class="ic">'+(k==='ok'?'✔':'✖')+'</span><span>'+esc(t)+'</span></div>').join('');
  });
  $('#secVerdict').innerHTML='<div class="banner">'+C.h('w.security.verdict.idle')+'</div>';
})();

/* ===================== 05 — DECIDER + NESTING ===================== */
(function(){
  const dfc=FC.draw($('#fcDecide'),{viewBox:'0 0 1060 460',nodes:[
    {id:'q1',type:'dec',x:20,y:20,w:230,h:84,lines:[C.t('w.decide.fc.rules1'),C.t('w.decide.fc.rules2')],fs:11.5},
    {id:'q2',type:'dec',x:20,y:158,w:230,h:88,lines:[C.t('w.decide.fc.steps1'),C.t('w.decide.fc.steps2')],fs:11.5},
    {id:'q3a',type:'dec',x:345,y:106,w:212,h:88,lines:[C.t('w.decide.fc.always1'),C.t('w.decide.fc.always2')],fs:11},
    {id:'q3b',type:'dec',x:345,y:296,w:212,h:88,lines:[C.t('w.decide.fc.always1'),C.t('w.decide.fc.always2')],fs:11},
    {id:'r1',type:'out',x:830,y:38,w:206,h:44,lines:[C.t('w.decide.fc.out.code')],fs:12},
    {id:'r2',type:'out',x:830,y:98,w:206,h:44,lines:[C.t('w.decide.fc.out.prompt')],fs:12},
    {id:'r3',type:'out',x:830,y:188,w:206,h:44,lines:[C.t('w.decide.fc.out.promptGraph')],fs:11},
    {id:'r4',type:'out',x:830,y:278,w:206,h:44,lines:[C.t('w.decide.fc.out.loop')],fs:12},
    {id:'r5',type:'out',x:830,y:368,w:206,h:44,lines:[C.t('w.decide.fc.out.graphLoop')],fs:11.5}
  ],edges:[
    {from:'q1',to:'r1',fs:'e',ts:'w',kind:'yes',label:C.t('w.decide.fc.edge.yes'),lx:300,ly:52},
    {from:'q1',to:'q2',kind:'no',label:C.t('w.decide.fc.edge.no'),lx:158,ly:136},
    {from:'q2',to:'q3a',fs:'e',ts:'w',kind:'yes',label:C.t('w.decide.fc.edge.oneStep'),lx:298,ly:172},
    {from:'q2',to:'q3b',fs:'s',ts:'w',kind:'no',label:C.t('w.decide.fc.edge.many'),via:[{x:135,y:340}],lx:250,ly:332},
    {from:'q3a',to:'r2',fs:'e',ts:'w',kind:'no',label:C.t('w.decide.fc.edge.no'),lx:700,ly:112},
    {from:'q3a',to:'r3',fs:'s',ts:'w',kind:'yes',label:C.t('w.decide.fc.edge.yes'),via:[{x:451,y:210}],lx:640,ly:204},
    {from:'q3b',to:'r4',fs:'e',ts:'w',kind:'no',label:C.t('w.decide.fc.edge.no'),lx:700,ly:292},
    {from:'q3b',to:'r5',fs:'s',ts:'w',kind:'yes',label:C.t('w.decide.fc.edge.yes'),via:[{x:451,y:390}],lx:640,ly:384}
  ]});
  function dim(){
    Object.values(dfc.nodes).forEach(g=>{g.classList.add('dim');g.classList.remove('live');});
    Object.values(dfc.edges).forEach(p=>{p.classList.add('dim');p.classList.remove('live');});
    Object.values(dfc.labels).forEach(t=>{t.classList.add('dim');t.classList.remove('live');});
  }
  function litePath(nodes,edges){
    dim();
    nodes.forEach(n=>{ const g=dfc.nodes[n]; if(g){g.classList.remove('dim');g.classList.add('live');} });
    edges.forEach(k=>{
      const p=dfc.edges[k]; if(p){p.classList.remove('dim');p.classList.add('live');}
      const t=dfc.labels[k]; if(t){t.classList.remove('dim');t.classList.add('live');}
    });
  }
  dim();

  const QS=[
    {id:'q1',q:C.t('w.decide.q1'),
     a:[['yes',C.t('w.decide.q1.a.yes')],['no',C.t('w.decide.q1.a.no')]]},
    {id:'q2',q:C.t('w.decide.q2'),
     a:[['one',C.t('w.decide.q2.a.one')],['many',C.t('w.decide.q2.a.many')]]},
    {id:'q3',q:C.t('w.decide.q3'),
     a:[['no',C.t('w.decide.q3.a.no')],['yes',C.t('w.decide.q3.a.yes')]]}
  ];
  const ans={}, box=$('#decider');
  QS.forEach(q=>{
    const w=document.createElement('div'); w.className='q';
    w.innerHTML='<div class="qt">'+esc(q.q)+'</div>';
    const row=document.createElement('div'); row.className='row';
    q.a.forEach(([v,lbl])=>{
      const b=document.createElement('button'); b.className='btn'; b.type='button'; b.textContent=lbl;
      b.addEventListener('click',()=>{
        ans[q.id]=v;
        $$('button',row).forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel'); decide();
      });
      row.appendChild(b);
    });
    w.appendChild(row); box.appendChild(w);
  });
  function decide(){
    if (!ans.q1||!ans.q2||!ans.q3) return;
    let t,b;
    if (ans.q1==='yes'){
      t=C.t('w.decide.rec.code.title');
      b=C.t('w.decide.rec.code.body');
      litePath(['q1','r1'],['q1>r1']);
    } else if (ans.q2==='one'&&ans.q3==='no'){
      t=C.t('w.decide.rec.prompt.title');
      b=C.t('w.decide.rec.prompt.body');
      litePath(['q1','q2','q3a','r2'],['q1>q2','q2>q3a','q3a>r2']);
    } else if (ans.q2==='one'&&ans.q3==='yes'){
      t=C.t('w.decide.rec.promptGraph.title');
      b=C.t('w.decide.rec.promptGraph.body');
      litePath(['q1','q2','q3a','r3'],['q1>q2','q2>q3a','q3a>r3']);
    } else if (ans.q3==='yes'){
      t=C.t('w.decide.rec.graphLoop.title');
      b=C.t('w.decide.rec.graphLoop.body');
      litePath(['q1','q2','q3b','r5'],['q1>q2','q2>q3b','q3b>r5']);
    } else {
      t=C.t('w.decide.rec.loop.title');
      b=C.t('w.decide.rec.loop.body');
      litePath(['q1','q2','q3b','r4'],['q1>q2','q2>q3b','q3b>r4']);
    }
    $('#recTitle').textContent=t; $('#recBody').textContent=b;
  }

  /* nesting diagram */
  (function(){
    const svg=$('#nestSvg');
    const layers=[
      {t:C.t('w.decide.nest.code'),x:8,  y:8,  w:644,h:294,c:'blue'},
      {t:C.t('w.decide.nest.harness'),x:40, y:48, w:580,h:222,c:'steel'},
      {t:C.t('w.decide.nest.graph'),                   x:74, y:90, w:512,h:150,c:'violet'},
      {t:C.t('w.decide.nest.loop'),                     x:110,y:132,w:440,h:88, c:'amber'},
      {t:C.t('w.decide.nest.prompt'),             x:146,y:170,w:368,h:44, c:'teal'}
    ];
    layers.forEach(L=>{
      svg.appendChild(el('rect',{x:L.x,y:L.y,width:L.w,height:L.h,rx:10,
        fill:'var(--'+L.c+'-soft)',stroke:'var(--'+L.c+')','stroke-width':1.8}));
      const t=el('text',{x:L.x+14,y:L.y+21,style:'font-family:var(--mono);font-size:11.5px;font-weight:700',fill:'var(--'+L.c+')'});
      t.appendChild(txt(L.t)); svg.appendChild(t);
    });
  })();
})();
/* every chart renders ~12% wider than its viewBox, so its internal text scales
   up with the rest of the page; .fcwrap keeps wide ones scrolling on their own */
(function(){
  document.querySelectorAll('.fcwrap svg').forEach(sv=>{
    if (sv.hasAttribute('data-fit')){          // must be legible whole, never scrolled
      sv.style.width='100%'; sv.style.maxWidth='100%'; return;
    }
    const vb=(sv.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);
    if (vb.length===4 && vb[2]>0) sv.style.minWidth = Math.round(vb[2]*1.12)+'px';
  });
})();
/* ===================== 07 — THE GAME ===================== */
(function(){
  const A={
    code:   {k:'code',   label:C.t('w.quiz.tool.code'),        sec:'code',    name:C.t('w.sec.name.code')},
    prompt: {k:'prompt', label:C.t('w.quiz.tool.prompt'),sec:'prompt',  name:C.t('w.sec.name.prompt')},
    context:{k:'context',label:C.t('w.quiz.tool.context'),sec:'context',name:C.t('w.sec.name.context')},
    loop:   {k:'loop',   label:C.t('w.quiz.tool.loop'),  sec:'loop',    name:C.t('w.sec.name.loop')},
    graph:  {k:'graph',  label:C.t('w.quiz.tool.graph'), sec:'graph',   name:C.t('w.sec.name.graph')},
    harness:{k:'harness',label:C.t('w.quiz.tool.harness'),sec:'harness', name:C.t('w.sec.name.harness')},
    evals:  {k:'evals',  label:C.t('w.quiz.tool.evals'),sec:'evals',name:C.t('w.sec.name.evals')},
    security:{k:'security',label:C.t('w.quiz.tool.security'),sec:'security',name:C.t('w.sec.name.security')}
  };
  const ORDER=['code','prompt','context','loop','graph','harness','evals','security'];
  const BRIEFS=[
    {who:C.t('w.quiz.brief1.who'),brief:C.t('w.quiz.brief1.brief'),ans:'code',
     why:C.t('w.quiz.brief1.why'),
     trap:C.t('w.quiz.brief1.trap')},
    {who:C.t('w.quiz.brief2.who'),brief:C.t('w.quiz.brief2.brief'),ans:'prompt',
     why:C.t('w.quiz.brief2.why'),
     trap:C.t('w.quiz.brief2.trap')},
    {who:C.t('w.quiz.brief3.who'),brief:C.t('w.quiz.brief3.brief'),ans:'context',
     why:C.t('w.quiz.brief3.why'),
     trap:C.t('w.quiz.brief3.trap')},
    {who:C.t('w.quiz.brief4.who'),brief:C.t('w.quiz.brief4.brief'),ans:'loop',
     why:C.t('w.quiz.brief4.why'),
     trap:C.t('w.quiz.brief4.trap')},
    {who:C.t('w.quiz.brief5.who'),brief:C.t('w.quiz.brief5.brief'),ans:'graph',
     why:C.t('w.quiz.brief5.why'),
     trap:C.t('w.quiz.brief5.trap')},
    {who:C.t('w.quiz.brief6.who'),brief:C.t('w.quiz.brief6.brief'),ans:'code',
     why:C.t('w.quiz.brief6.why'),
     trap:C.t('w.quiz.brief6.trap')},
    {who:C.t('w.quiz.brief7.who'),brief:C.t('w.quiz.brief7.brief'),ans:'context',
     why:C.t('w.quiz.brief7.why'),
     trap:C.t('w.quiz.brief7.trap')},
    {who:C.t('w.quiz.brief8.who'),brief:C.t('w.quiz.brief8.brief'),ans:'prompt',
     why:C.t('w.quiz.brief8.why'),
     trap:C.t('w.quiz.brief8.trap')},
    {who:C.t('w.quiz.brief9.who'),brief:C.t('w.quiz.brief9.brief'),ans:'graph',
     why:C.t('w.quiz.brief9.why'),
     trap:C.t('w.quiz.brief9.trap')},
    {who:C.t('w.quiz.brief10.who'),brief:C.t('w.quiz.brief10.brief'),ans:'harness',
     why:C.t('w.quiz.brief10.why'),
     trap:C.t('w.quiz.brief10.trap')},
    {who:C.t('w.quiz.brief11.who'),brief:C.t('w.quiz.brief11.brief'),ans:'harness',
     why:C.t('w.quiz.brief11.why'),
     trap:C.t('w.quiz.brief11.trap')},
    {who:C.t('w.quiz.brief12.who'),brief:C.t('w.quiz.brief12.brief'),ans:'evals',
     why:C.t('w.quiz.brief12.why'),
     trap:C.t('w.quiz.brief12.trap')},
    {who:C.t('w.quiz.brief13.who'),brief:C.t('w.quiz.brief13.brief'),ans:'security',
     why:C.t('w.quiz.brief13.why'),
     trap:C.t('w.quiz.brief13.trap')},
    {who:C.t('w.quiz.brief14.who'),brief:C.t('w.quiz.brief14.brief'),ans:'loop',
     why:C.t('w.quiz.brief14.why'),
     trap:C.t('w.quiz.brief14.trap')}
  ];

  let deck=[], at=0, score=0, streak=0, best=0, answered=false;
  const missedBy={};

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  function start(){
    deck=shuffle(BRIEFS.slice()).slice(0,10); at=0; score=0; streak=0; best=0; answered=false;
    Object.keys(missedBy).forEach(k=>delete missedBy[k]);
    $('#gEnd').hidden=true; $('#gStage').hidden=false;
    $('#gScore').textContent='0'; $('#gStreak').textContent='0';
    render();
  }
  function progress(){
    const p=$('#gProg'); p.innerHTML='';
    deck.forEach((_,i)=>{
      const sp=document.createElement('span');
      if (i<at) sp.className = deck[i].__ok ? 'hit' : 'miss';
      else if (i===at) sp.className='now';
      p.appendChild(sp);
    });
  }
  function render(){
    answered=false;
    const b=deck[at];
    $('#gRound').textContent=at+1;
    progress();
    $('#gBrief').innerHTML='<span class="who">'+C.h('w.quiz.says',{who:esc(b.who)})+'</span>'+esc(b.brief);
    $('#gFeedback').innerHTML='';
    $('#gNext').hidden=true;
    const o=$('#gOpts'); o.innerHTML='';
    ORDER.forEach(k=>{
      const btn=document.createElement('button');
      btn.className='gopt'; btn.type='button'; btn.textContent=A[k].label;
      btn.addEventListener('click',()=>answer(k,btn));
      o.appendChild(btn);
    });
  }
  function answer(pick,btn){
    if (answered) return;
    answered=true;
    const b=deck[at], ok=(pick===b.ans);
    b.__ok=ok;
    $$('#gOpts .gopt').forEach(x=>{
      x.disabled=true;
      if (x.textContent===A[b.ans].label) x.classList.add('right');
    });
    if (!ok){
      btn.classList.add('wrong');
      missedBy[b.ans]=(missedBy[b.ans]||0)+1;
      streak=0;
    } else {
      score++; streak++; best=Math.max(best,streak);
    }
    $('#gScore').textContent=score; $('#gStreak').textContent=streak;
    progress();
    $('#gFeedback').innerHTML=
      '<div class="gfb '+(ok?'right':'wrong')+'">'+
      '<div class="hd">'+C.h(ok?'w.quiz.right':'w.quiz.wrong',{name:A[b.ans].name})+'</div>'+
      '<p>'+esc(b.why)+'</p><p>'+C.h('w.quiz.tempts',{trap:esc(b.trap)})+'</p></div>';
    $('#gNext').hidden=false;
    $('#gNext').textContent = (at===deck.length-1) ? C.t('w.quiz.seeScore') : C.t('w.quiz.nextBrief');
  }
  $('#gNext').addEventListener('click',()=>{
    if (at<deck.length-1){ at++; render(); }
    else finish();
  });
  $('#gRestart').addEventListener('click',start);

  function finish(){
    $('#gStage').hidden=true;
    const e=$('#gEnd'); e.hidden=false;
    const pct=Math.round(score/deck.length*100);
    const grade = pct===100?C.h('w.quiz.grade.flawless'):
                  pct>=80 ?C.h('w.quiz.grade.strong'):
                  pct>=60 ?C.h('w.quiz.grade.solid'):
                  pct>=40 ?C.h('w.quiz.grade.getting'):
                           C.h('w.quiz.grade.early');
    let h='<div class="gscore"><div class="big">'+score+'<span style="font-size:26px;color:var(--ink-3)">/'+deck.length+'</span></div>'+
          '<div class="grade">'+grade+'</div>'+
          '<p class="mono-note" style="margin-top:8px">'+C.h('w.quiz.streak',{n:best})+'</p></div>';
    const weak=Object.keys(missedBy).sort((a,b)=>missedBy[b]-missedBy[a]);
    if (weak.length){
      h+='<p style="margin-top:18px;font-size:17px">'+C.h('w.quiz.weak')+'</p><div class="gweak">';
      weak.forEach(k=>{
        h+='<div class="wk"><span>'+C.h(C.p('w.quiz.missed',missedBy[k]),{label:A[k].label,n:missedBy[k]})+'</span>'+
           '<button class="btn" type="button" data-goto="'+A[k].sec+'">'+C.h('w.quiz.revisit')+'</button></div>';
      });
      h+='</div>';
    } else {
      h+='<div class="banner ok" style="margin-top:16px">'+C.h('w.quiz.allRight')+'</div>';
    }
    e.innerHTML=h;
    $('#gNext').hidden=true;
    progress();
  }
  start();
})();
//END

}
