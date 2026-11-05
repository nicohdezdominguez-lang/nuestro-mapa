// Nuestro mapa · globo interactivo
// Los datos vienen de data/mundo.js (mapa) y data/viajes.js (generado con generar.py)
(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GEO=window.GEO,S=window.VIAJES||{cities:[]};
const mk=o=>topojson.feature(o,o.objects.countries).features.filter(f=>f.id!=='010');
const HI=mk(GEO.hi),LO=mk(GEO.lo),NM={};
HI.forEach(f=>{if(f.id)NM[f.id]=GEO.names[f.id]||f.properties.name});
const walk=(a,fn)=>{if(typeof a[0]==='number')fn(a);else a.forEach(x=>walk(x,fn))};
[HI,LO].forEach(L=>L.forEach(f=>{f.c=d3.geoCentroid(f);let r=0;walk(f.geometry.coordinates,p=>{const d=d3.geoDistance(f.c,p);if(d>r)r=d});f.r=r}));
const cv=$('#cv'),ctx=cv.getContext('2d'),proj=d3.geoOrthographic().clipAngle(90).precision(1),path=d3.geoPath(proj,ctx),grat=d3.geoGraticule10();
let W=0,H=0,DPR=1,V={lo:0,la:20,R:150,cx:0,cy:0},fl=null,focus=null,cur=null;
let zt=0,dirty=1,movingT=0,vx=0,vy=0,lastTouch=0,pinPos=[],bornAt={},introEnd=0,firstGo=true,C={};
const visited=()=>new Set(S.cities.map(c=>c.c));
const R0=()=>Math.min(W*.44,H*.36);
const ST=Array.from({length:70},()=>[Math.random(),Math.random(),Math.random()*1.5+.4,Math.random()*6]);
const TK=['o1','o2','land','line','vis','vis2','vline','glow','glow0','shade','grat','pin','lbl','lblbg','stars'];
function readC(){const s=getComputedStyle(document.documentElement);TK.forEach(k=>C[k]=s.getPropertyValue('--'+k).trim());dirty=1}
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,t)=>{const x=hx(a),y=hx(b);return`rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join()})`};
function size(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);cv.width=W*DPR;cv.height=H*DPR;dirty=1}

/* ---------- dibujo del globo ---------- */
function heart(x,y,s){ctx.beginPath();ctx.moveTo(x,y+s*.9);ctx.bezierCurveTo(x-s*1.7,y-s*.1,x-s*.8,y-s*1.4,x,y-s*.5);ctx.bezierCurveTo(x+s*.8,y-s*1.4,x+s*1.7,y-s*.1,x,y+s*.9);ctx.closePath()}
function draw(now){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  if(C.stars==='1'){ctx.fillStyle='#fff';ST.forEach(s=>{ctx.globalAlpha=.25+.6*Math.abs(Math.sin(now/1700+s[3]));ctx.fillRect(s[0]*W,s[1]*H,s[2],s[2])});ctx.globalAlpha=1}
  const{cx,cy,R}=V;proj.rotate([-V.lo,-V.la]).translate([cx,cy]).scale(R);
  let g=ctx.createRadialGradient(cx,cy,R*.96,cx,cy,R*1.2);g.addColorStop(0,C.glow);g.addColorStop(1,C.glow0);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*1.2,0,7);ctx.fill();
  g=ctx.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R);g.addColorStop(0,C.o1);g.addColorStop(1,C.o2);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
  // mientras te mueves se dibuja con menos detalle, y al parar con todo
  const moving=pts.size>0||now-movingT<150,hi=!moving;
  if(R<R0()*3){ctx.beginPath();path(grat);ctx.strokeStyle=C.grat;ctx.lineWidth=.6;ctx.stroke()}
  const th=Math.min(Math.PI/2,Math.asin(Math.min(1,Math.hypot(W,H)/R))+.1),ctr=[V.lo,V.la],vis=visited();
  const dr=f=>{
    if(d3.geoDistance(ctr,f.c)-f.r>th)return;
    const v=vis.has(f.id);let fill=C.land;
    if(v){const t=Math.min(1,Math.max(0,(now-(bornAt[f.id]||0))/1000));fill=mix(C.land,f.id===focus?C.vis2:C.vis,t*t*(3-2*t))}
    ctx.globalAlpha=focus&&f.id!==focus?.5:1;ctx.beginPath();path(f);ctx.fillStyle=fill;ctx.fill();
    ctx.strokeStyle=v?C.vline:C.line;ctx.lineWidth=v?1:.5;ctx.stroke();
  };
  (hi?HI:LO).forEach(f=>{if(!hi&&vis.has(f.id))return;dr(f)});
  if(!hi)HI.forEach(f=>{if(vis.has(f.id))dr(f)});
  ctx.globalAlpha=1;
  g=ctx.createRadialGradient(cx-R*.3,cy-R*.35,R*.25,cx,cy,R*1.01);g.addColorStop(0,'rgba(255,255,255,.07)');g.addColorStop(1,C.shade);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
  pinPos=[];
  if(focus){
    S.cities.filter(c=>c.c===focus).forEach((c,i)=>{
      if(d3.geoDistance(ctr,[c.lo,c.la])>1.45)return;
      const[x,y]=proj([c.lo,c.la]),on=cur&&cur.id===c.id,s=on?7.5:6,ph=((now/1700)+i*.37)%1;
      pinPos.push({id:c.id,x,y});
      ctx.globalAlpha=(1-ph)*.7;ctx.strokeStyle=C.pin;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,8+ph*30,0,7);ctx.stroke();ctx.globalAlpha=1;
      heart(x,y,s);ctx.fillStyle=C.pin;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.stroke();
      ctx.font='600 13px Inter,sans-serif';ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle=C.lblbg;ctx.strokeText(c.n,x,y-17);ctx.fillStyle=C.lbl;ctx.fillText(c.n,x,y-17);
    });
  }
}

/* ---------- cámara, vuelo y gestos ---------- */
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
function fly(t,ms=1500){zt=0;const a=[V.lo,V.la],b=[t.lo,t.la];fl={s:{...V},t,t0:performance.now(),ms,d:d3.geoDistance(a,b),I:d3.geoInterpolate(a,b)}}
function loop(now){
  requestAnimationFrame(loop);
  if(zt){V.R*=Math.pow(zt/V.R,.22);movingT=now;dirty=1;if(Math.abs(Math.log(zt/V.R))<.003){V.R=zt;zt=0}}
  if(fl){const u=Math.min(1,(now-fl.t0)/fl.ms),q=ease(u),p=fl.I(q),s=fl.s,t=fl.t;
    V.lo=p[0];V.la=p[1];V.R=s.R*Math.pow(t.R/s.R,q)*(1-.3*Math.sin(Math.PI*q)*Math.min(1,fl.d*1.2));
    V.cx=s.cx+(t.cx-s.cx)*q;V.cy=s.cy+(t.cy-s.cy)*q;movingT=now;dirty=1;if(u>=1)fl=null}
  else if(!pts.size){
    if(Math.abs(vx)>.01||Math.abs(vy)>.01){V.lo-=vx;V.la=Math.max(-88,Math.min(88,V.la+vy));vx*=.94;vy*=.94;movingT=now;dirty=1}
    else if(!focus&&!cur&&now-lastTouch>3500&&V.R<R0()*2){V.lo+=.04;movingT=now;dirty=1}
  }
  if(dirty||focus||now<introEnd||now-movingT<220){dirty=0;draw(now)}
}
const pts=new Map();let moved=0,t0=0;
cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1){moved=0;t0=performance.now()}fl=null;zt=0;vx=vy=0;lastTouch=performance.now()};
cv.onpointermove=e=>{
  if(!pts.has(e.pointerId))return;
  const o=[...pts.values()],p=pts.get(e.pointerId),n=[e.clientX,e.clientY];pts.set(e.pointerId,n);lastTouch=performance.now();
  if(pts.size===1){const k=57.2958/V.R;vx=(n[0]-p[0])*k;vy=(n[1]-p[1])*k;V.lo-=vx;V.la=Math.max(-88,Math.min(88,V.la+vy));moved+=Math.abs(n[0]-p[0])+Math.abs(n[1]-p[1])}
  else if(pts.size===2){const q=[...pts.values()],d0=Math.hypot(o[0][0]-o[1][0],o[0][1]-o[1][1]),d1=Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1]);
    V.R=Math.min(Math.max(V.R*d1/(d0||1),R0()*.7),14000);moved+=20;vx=vy=0}
  dirty=1;
};
cv.onpointerup=cv.onpointercancel=e=>{const was=pts.size===1;pts.delete(e.pointerId);if(was&&e.type==='pointerup'&&moved<8&&performance.now()-t0<600){vx=vy=0;tapAt(e.clientX,e.clientY)}};
cv.onwheel=e=>{e.preventDefault();fl=null;lastTouch=performance.now();zt=Math.min(Math.max((zt||V.R)*(e.deltaY<0?1.25:1/1.25),R0()*.7),14000);dirty=1};

function tapAt(x,y){
  for(const p of pinPos){if(Math.hypot(p.x-x,p.y-y)<28){location.hash='c-'+p.id;return}}
  const ll=proj.invert([x,y]);if(!ll||isNaN(ll[0]))return;
  const f=HI.find(f=>f.id&&d3.geoDistance(ll,f.c)<=f.r&&d3.geoContains(f,ll));
  if(f){if(visited().has(f.id))location.hash='p-'+f.id;else toast('Aún no hemos estado en '+NM[f.id])}
}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2800)}

/* ---------- vistas: inicio, país, ciudad ---------- */
function homeV(){
  const cs=[...visited()].map(id=>HI.find(f=>f.id===id)).filter(Boolean);let lo=10,la=25;
  if(cs.length){const c=d3.geoCentroid({type:'MultiPoint',coordinates:cs.map(f=>f.c)});lo=c[0];la=c[1]}
  return{lo,la:Math.max(-50,Math.min(60,la)),R:R0(),cx:W/2,cy:H*.5};
}
function cView(id){
  const f=HI.find(x=>x.id===id),ps=f.geometry.type==='MultiPolygon'?f.geometry.coordinates.map(c=>({type:'Polygon',coordinates:c})):[f.geometry];
  const ar=ps.map(p=>d3.geoArea(p)),mx=Math.max(...ar),keep=ps.filter((p,i)=>ar[i]>=mx*.25);
  const cen=d3.geoCentroid({type:'GeometryCollection',geometries:keep});let a=.01;
  keep.forEach(p=>walk(p.coordinates,q=>{a=Math.max(a,d3.geoDistance(cen,q))}));
  S.cities.filter(c=>c.c===id).forEach(c=>{a=Math.max(a,d3.geoDistance(cen,[c.lo,c.la]))});
  const R=Math.min(Math.max(.4*Math.min(W,H*.6)/Math.sin(Math.min(a+.02,1.4)),R0()*.9),12000);
  return{lo:cen[0],la:cen[1],R,cx:W/2,cy:H*.52};
}
function hud(){
  const h=$('#ht'),np=S.cities.reduce((a,c)=>a+c.p.length,0),n_=(n,a,b)=>n+' '+(n===1?a:b);
  if(focus){const cs=S.cities.filter(c=>c.c===focus);h.querySelector('h1').textContent=NM[focus];
    h.querySelector('p').textContent=n_(cs.length,'ciudad','ciudades')+' · '+n_(cs.reduce((a,c)=>a+c.p.length,0),'foto','fotos')}
  else{h.querySelector('h1').textContent='Nuestro mapa';
    h.querySelector('p').textContent=n_(visited().size,'país','países')+' · '+n_(S.cities.length,'ciudad','ciudades')+' · '+n_(np,'foto','fotos')}
  document.body.classList.toggle('sub',!!focus);
  h.classList.remove('sw');void h.offsetWidth;h.classList.add('sw');
}
function go(){
  const h=location.hash.slice(1);let m;closeSheet();cur=null;dirty=1;
  if((m=h.match(/^c-(\w+)$/))){
    const c=S.cities.find(x=>x.id===m[1]);
    if(c){focus=c.c;cur=c;const v=cView(c.c);
      fly({lo:c.lo,la:c.la,R:Math.min(v.R*2.4,14000),cx:W>=900?(W-464)/2:W/2,cy:W>=900?H/2:H*.2});hud();openSheet(c);return}
  }
  if((m=h.match(/^p-(\w+)$/))&&NM[m[1]]&&visited().has(m[1])){focus=m[1];fly(cView(focus));hud();return}
  focus=null;fly(homeV(),firstGo?2800:1400);firstGo=false;hud();
}

/* ---------- álbum (baraja de polaroids) ---------- */
function openSheet(c){
  const n=c.p.length;$('#sn').textContent=c.n;$('#sp').textContent=NM[c.c]+' · '+(n?n+(n===1?' recuerdo':' recuerdos'):'sin recuerdos aún');
  $('#gal').innerHTML='<div class="gi">'+(n?c.p.map((p,i)=>`<button class="ph" style="--r:${(((i*5)%7)-3)*.8}deg" data-i="${i}"><span class="pf"><img src="${esc(p[0])}" alt="${esc(p[1])}" decoding="async"${i>7?' loading="lazy"':''}><span class="cap">${esc(p[1])}</span></span></button>`).join(''):'<div class="empty">Pronto habrá recuerdos aquí ♥</div>')+'</div>';
  $('#sheet').classList.add('on');$('#scrim').classList.add('on');$('#sheet').setAttribute('aria-hidden','false');
  if(n)setTimeout(deal,350);
}
function deal(){
  const g=$('#gal'),cs=[...g.querySelectorAll('.ph')];if(!cs.length)return;
  const gr=g.getBoundingClientRect(),mx=gr.left+gr.width/2,my=gr.top+Math.min(gr.height*.4,210),N=cs.length;
  cs.forEach((c,i)=>{const r=c.getBoundingClientRect(),a=Math.random()*18-9;
    c.style.transition='none';c.style.zIndex=N-i;c.style.opacity=0;
    c.style.transform=`translate(${mx-(r.left+r.width/2)}px,${my-(r.top+r.height/2)-60}px) rotate(${a}deg) scale(.8)`});
  void g.offsetWidth;
  cs.forEach((c,i)=>{const d=Math.min(i,8)*60;c.style.transition=`opacity .35s ${d}ms,transform .55s cubic-bezier(.2,.9,.3,1.25) ${d}ms`;c.style.opacity=1;
    c.style.transform=c.style.transform.replace(/translate\(([^,]+),([^)]+)\)/,(m,x,y)=>`translate(${x},${parseFloat(y)+60}px)`)});
  setTimeout(()=>cs.forEach((c,i)=>{c.style.transition=`transform .9s cubic-bezier(.2,.85,.25,1.08) ${Math.min(i,14)*90}ms`;c.style.transform=''}),1000);
  setTimeout(()=>cs.forEach(c=>{c.style.transition='';c.style.zIndex='';c.style.opacity=''}),1000+14*90+1100);
}
function closeSheet(){$('#sheet').classList.remove('on');$('#scrim').classList.remove('on');$('#vw').classList.remove('on');$('#sheet').setAttribute('aria-hidden','true')}
$('#gal').addEventListener('load',e=>e.target.classList.add('ok'),true);
$('#gal').addEventListener('error',e=>e.target.classList.add('ok'),true);
$('#gal').onclick=e=>{const b=e.target.closest('.ph');if(b)view(+b.dataset.i)};
$('#scrim').onclick=$('#sx').onclick=()=>{if(cur)location.hash='p-'+cur.c};
$('#back').onclick=()=>{location.hash=''};
$('#wd').onclick=()=>{if(location.hash.length>1)location.hash='';else{lastTouch=performance.now();fly(homeV())}};

let vi=0;
function view(i,dir){
  const n=cur.p.length;vi=(i+n)%n;const p=cur.p[vi],f=$('#vf');
  f.className='';void f.offsetWidth;$('#vi').src=p[0];$('#vi').alt=p[1]||'';$('#vk').textContent=p[1]||'';f.className=dir<0?'r':'l';
  $('#vn').textContent=(vi+1)+' / '+n;$('#vw').classList.add('on');
}
$('#vx').onclick=()=>$('#vw').classList.remove('on');
let sx=0,sy=0;
$('#vs').onpointerdown=e=>{sx=e.clientX;sy=e.clientY};
$('#vs').onpointerup=e=>{const dx=e.clientX-sx,dy=e.clientY-sy;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))view(vi+(dx<0?1:-1),dx<0?1:-1);else if(dy>90)$('#vw').classList.remove('on')};
addEventListener('keydown',e=>{
  if(e.key==='Escape'){if($('#vw').classList.contains('on'))$('#vw').classList.remove('on');else if(cur)location.hash='p-'+cur.c}
  if($('#vw').classList.contains('on')){if(e.key==='ArrowRight')view(vi+1,1);if(e.key==='ArrowLeft')view(vi-1,-1)}
});

/* ---------- arranque ---------- */
addEventListener('hashchange',go);
addEventListener('resize',()=>{size();go()});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readC);
size();readC();
const hv=homeV();V={...hv,lo:hv.lo-110,R:R0()*.55};
[...visited()].forEach((id,i)=>{bornAt[id]=performance.now()+1200+i*220});introEnd=performance.now()+1200+visited().size*220+1100;
hud();requestAnimationFrame(loop);setTimeout(go,300);
})();
