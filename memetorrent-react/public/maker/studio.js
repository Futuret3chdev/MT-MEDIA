/* MT Android Studio — device lab + tools Google’s IDE does not ship */
const COLS=32, ROWS=16, CELL=22;
const TILE={empty:0,ground:1,hazard:2,coin:3,spawn:4,exit:5,enemy:6,spring:7,ice:8,check:9,crate:10};
const BRUSHES=[[0,'Erase'],[1,'Ground'],[2,'Spike'],[3,'Coin'],[4,'Start'],[5,'Exit'],[6,'Enemy'],[7,'Spring'],[8,'Ice'],[9,'Check'],[10,'Crate']];
const THEMES={
  night:{bg:'#0b1020',ground:'#2a3348',accent:'#00ff99',hazard:'#ff4d6a',coin:'#ffd166'},
  forest:{bg:'#0d1a12',ground:'#2d5a3d',accent:'#9ef01a',hazard:'#e85d04',coin:'#ffe66d'},
  city:{bg:'#140c18',ground:'#3d2b56',accent:'#ff4dff',hazard:'#ff006e',coin:'#00f5d4'},
  space:{bg:'#070712',ground:'#1b2744',accent:'#48cae4',hazard:'#c77dff',coin:'#f4d35e'}
};
const DEVICES={
  pixel:{id:'pixel',label:'Pixel 8',w:360,h:780,kind:'phone'},
  compact:{id:'compact',label:'Compact',w:320,h:640,kind:'phone'},
  fold:{id:'fold',label:'Pixel Fold',w:640,h:720,kind:'fold'},
  tablet:{id:'tablet',label:'Tablet',w:720,h:460,kind:'tablet'},
  watch:{id:'watch',label:'Watch',w:192,h:192,kind:'watch'},
  tv:{id:'tv',label:'Android TV',w:640,h:360,kind:'tv'},
  car:{id:'car',label:'Android Auto',w:700,h:260,kind:'car'}
};

const tiles=new Array(COLS*ROWS).fill(0);
for(let x=0;x<COLS;x++) tiles[(ROWS-1)*COLS+x]=1;
tiles[(ROWS-2)*COLS+2]=4;
tiles[(ROWS-5)*COLS+10]=1; tiles[(ROWS-5)*COLS+11]=1; tiles[(ROWS-5)*COLS+12]=1;
tiles[(ROWS-6)*COLS+11]=3;
tiles[(ROWS-2)*COLS+20]=2;
tiles[(ROWS-8)*COLS+22]=1; tiles[(ROWS-8)*COLS+23]=1; tiles[(ROWS-8)*COLS+24]=1;
tiles[(ROWS-9)*COLS+24]=5;
tiles[(ROWS-2)*COLS+14]=6;
tiles[(ROWS-2)*COLS+18]=8;
tiles[(ROWS-3)*COLS+8]=9;
tiles[(ROWS-2)*COLS+16]=10;

const heat=new Array(COLS*ROWS).fill(0);
const netLog=[];
const logs=[];
let lastApk=null, rec=null, recChunks=[], blogTab='log';
const emus=[];
let playing=false, raf=0, keys={}, fps=0, frames=0, lastFps=performance.now();
let replay=[], replaying=false, ri=0;

const cv=document.getElementById('c');
const ctx=cv.getContext('2d');
cv.width=COLS*CELL; cv.height=ROWS*CELL;
const bar=document.getElementById('brushes');
let brush=1;
BRUSHES.forEach(([id,label])=>{
  const b=document.createElement('button');
  b.textContent=(id+1)+' '+label;
  b.onclick=()=>{ brush=id; [...bar.children].forEach(x=>x.classList.toggle('on',x===b)); };
  if(id===1) b.classList.add('on');
  bar.appendChild(b);
});
const sel=document.getElementById('devsel');
Object.values(DEVICES).forEach(d=>{ const o=document.createElement('option'); o.value=d.id; o.textContent=d.label; sel.appendChild(o); });

function $(id){ return document.getElementById(id); }
function log(msg, cls, tag){
  const line=`${new Date().toISOString().slice(11,23)} ${tag||'MTStudio'}: ${msg}`;
  const el=document.createElement('div');
  if(cls) el.className=cls;
  el.textContent=line;
  if(blogTab==='log' || cls){ /* always store */ }
  logs.unshift({tab:'log', cls, text:line});
  if(logs.length>400) logs.pop();
  renderBlog();
}
function renderBlog(){
  const el=$('blog');
  if(blogTab==='prof'){
    el.innerHTML=`fps ${fps}   emulators ${emus.length}   replay ${replay.length} frames\n`+
      `gravity ${$('grav').value}  jump ${$('jump').value}  freeze ${$('freeze').checked}\n`+
      `<div class="meter"><i style="width:${Math.min(100,fps)}%"></i></div>`;
    return;
  }
  if(blogTab==='net'){
    el.textContent = netLog.slice(0,40).join('\n') || 'No traffic. Shop and GPS writes appear here. Android Studio needs a running AVD + profiler session.';
    return;
  }
  if(blogTab==='heat'){
    let s='Deaths by tile (darker = more). Unique vs Logcat.\n';
    for(let y=0;y<ROWS;y++){
      let row='';
      for(let x=0;x<COLS;x++){ const n=heat[y*COLS+x]; row += n? n.toString(16):'.'; }
      s+=row+'\n';
    }
    el.textContent=s;
    return;
  }
  if(blogTab==='adb'){
    el.innerHTML='mt emu — no SDK, no adb daemon.\nCommands: help, devices, rotate, shake, airplane, twin, gps, screenshot, record, tap\n<input id="adbin" placeholder="emu devices" style="width:100%;margin-top:6px;background:#111;color:#c0c4cc;border:1px solid #333;padding:6px">';
    const inp=$('adbin');
    inp.onkeydown=e=>{ if(e.key==='Enter'){ adb(inp.value); inp.value=''; } };
    return;
  }
  if(blogTab==='apk'){
    el.textContent = lastApk
      ? `APK ${lastApk.name}\nsize ${lastApk.size} bytes\nsigned v2+v3 (MT debug key)\nshell WebView + assets/index.html\npackage ${$('pkg').value}\nversion ${$('ver').value}\nNo Gradle. No Android SDK on this PC.`
      : 'Build APK to analyze. This panel reads the package we just signed — Android Studio needs the APK Analyzer window and a disk file.';
    return;
  }
  el.innerHTML = logs.filter(l=>l.tab==='log').slice(0,80).map(l=>`<div class="${l.cls||''}">${esc(l.text)}</div>`).join('');
  el.scrollTop=0;
}
function esc(s){ return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function spec(){
  return {
    type:'platformer', name:$('name').value, theme:$('theme').value,
    cols:COLS, rows:ROWS, tiles:tiles.slice(),
    gravity:parseFloat($('grav').value)||0.45,
    jump:parseFloat($('jump').value)||-8.2,
    lives:parseInt($('lives').value,10)||3,
    pkg:$('pkg').value, ver:$('ver').value, seed:$('seed').value,
    spin:+$('spin').value, espd:+$('espd').value, part:+$('part').value,
    freeze:$('freeze').checked, bigui:$('bigui').checked, nomove:$('nomove').checked, rtl:$('rtl').checked,
    shop:{life:+$('priceLife').value, jump:+$('priceJump').value, mag:+$('priceMag').value, wallet:$('wallet').value},
    listing:{short:$('sdesc').value, long:$('ldesc').value}
  };
}
function th(){ return THEMES[$('theme').value]; }
function color(t,T){
  return [null,T.ground,T.hazard,T.coin,'#fff',T.accent,'#ff8fab','#90e0ef','#a0c4e8', '#7bed9f', '#c4a574'][t];
}

function drawEditor(){
  const T=th();
  ctx.fillStyle=T.bg; ctx.fillRect(0,0,cv.width,cv.height);
  for(let i=0;i<tiles.length;i++){
    const t=tiles[i]; if(!t) continue;
    const x=(i%COLS)*CELL, y=Math.floor(i/COLS)*CELL;
    ctx.fillStyle=color(t,T);
    if(t===2){ ctx.beginPath(); ctx.moveTo(x,y+CELL); ctx.lineTo(x+CELL/2,y); ctx.lineTo(x+CELL,y+CELL); ctx.fill(); }
    else if(t===3){ ctx.beginPath(); ctx.arc(x+CELL/2,y+CELL/2,CELL*0.28,0,6.28); ctx.fill(); }
    else ctx.fillRect(x+1,y+1,CELL-2,CELL-2);
    if(heat[i]){ ctx.fillStyle=`rgba(255,60,60,${Math.min(0.7,heat[i]/8)})`; ctx.fillRect(x,y,CELL,CELL); }
  }
}
function paintAt(e){
  const r=cv.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/CELL*(cv.width/r.width));
  const y=Math.floor((e.clientY-r.top)/CELL*(cv.height/r.height));
  if(x<0||y<0||x>=COLS||y>=ROWS) return;
  const i=y*COLS+x;
  if(brush===4){ for(let k=0;k<tiles.length;k++) if(tiles[k]===4) tiles[k]=0; }
  tiles[i]=brush;
  drawEditor();
}
cv.onpointerdown=e=>{ cv.setPointerCapture(e.pointerId); paintAt(e); };
cv.onpointermove=e=>{ if(e.buttons) paintAt(e); };

function hashSeed(s){ let h=2166136261; for(let i=0;i<s.length;i++) h^=s.charCodeAt(i), h=Math.imul(h,16777619); return h>>>0; }

function makeWorld(s){
  const w={
    tiles:s.tiles.slice(), T:THEMES[s.theme]||THEMES.night, s,
    coins:0, lives:s.lives, t:0, particles:[], check:null, dead:0,
    rng: hashSeed(s.seed||'mt')
  };
  w.rand=()=>{ w.rng^=w.rng<<13; w.rng^=w.rng>>>17; w.rng^=w.rng<<5; return (w.rng>>>0)/4294967296; };
  w.spawn=()=>{
    const i=w.tiles.indexOf(4);
    const x=i<0?20:(i%COLS)*CELL+4;
    const y=i<0?20:Math.floor(i/COLS)*CELL-16;
    w.p={x,y,vx:0,vy:0};
  };
  w.spawn();
  w.enemies=[];
  w.tiles.forEach((t,i)=>{ if(t===6) w.enemies.push({i, x:(i%COLS)*CELL, y:Math.floor(i/COLS)*CELL, dir:1}); });
  return w;
}
function solid(w,px,py){
  const cx=Math.floor((px+7)/CELL), cy=Math.floor((py+15)/CELL);
  if(cx<0||cy<0||cx>=COLS||cy>=ROWS) return 1;
  const t=w.tiles[cy*COLS+cx];
  return t===1||t===7||t===10?t:0;
}
function cellAt(w,px,py){
  const cx=Math.floor((px+7)/CELL), cy=Math.floor((py+8)/CELL);
  if(cx<0||cy<0||cx>=COLS||cy>=ROWS) return 0;
  return w.tiles[cy*COLS+cx];
}
function burst(w,x,y,c){
  const n=w.s.part||8;
  for(let i=0;i<n;i++) w.particles.push({x,y,vx:(w.rand()-0.5)*3,vy:(w.rand()-0.8)*3,life:30,c});
}
function stepWorld(w, input, dt){
  if(w.s.freeze) dt=0;
  w.t+=dt;
  const g=w.s.gravity, jump=w.s.jump;
  if(input.left) w.p.vx-=0.4;
  if(input.right) w.p.vx+=0.4;
  const onIce=cellAt(w,w.p.x,w.p.y+12)===8;
  w.p.vx*=onIce?0.96:0.8;
  w.p.vy+=g;
  w.p.x+=w.p.vx;
  if(solid(w,w.p.x,w.p.y)){ w.p.x-=w.p.vx; w.p.vx=0; }
  w.p.y+=w.p.vy;
  if(solid(w,w.p.x,w.p.y)){
    w.p.y-=w.p.vy; w.p.vy=0;
    if(input.up) w.p.vy=jump;
  }
  const hit=cellAt(w,w.p.x,w.p.y);
  if(hit===7 && input.up) w.p.vy=jump*1.35;
  if(hit===9) w.check={x:w.p.x,y:w.p.y};
  if(hit===3){
    const i=Math.floor((w.p.y+8)/CELL)*COLS+Math.floor((w.p.x+7)/CELL);
    w.tiles[i]=0; w.coins++; burst(w,w.p.x,w.p.y,w.T.coin);
    netLog.unshift('GET /v1/scores 200  +1 coin');
  }
  if(hit===2||hit===6){
    const cell=Math.floor((w.p.y+8)/CELL)*COLS+Math.floor((w.p.x+7)/CELL);
    if(cell>=0&&cell<heat.length) heat[cell]++;
    w.lives--; w.dead++;
    log('player died lives='+w.lives,'bad','MTGame');
    if(w.lives<=0){ w.lives=w.s.lives; w.tiles=w.s.tiles.slice(); w.coins=0; }
    if(w.check) w.p={x:w.check.x,y:w.check.y,vx:0,vy:0}; else w.spawn();
  }
  if(hit===5){ w.win=true; log('exit reached coins='+w.coins,'ok','MTGame'); }
  if(w.p.y>ROWS*CELL){ w.lives--; w.spawn(); }
  const spd=(w.s.espd||6)*0.15;
  w.enemies.forEach(en=>{
    en.x+=en.dir*spd;
    const cx=Math.floor((en.x+10)/CELL), cy=Math.floor((en.y)/CELL);
    if(!w.tiles[(cy)*COLS+cx] || w.tiles[cy*COLS+cx]===2) en.dir*=-1;
    const dx=en.x-w.p.x, dy=en.y-w.p.y;
    if(dx*dx+dy*dy<140){ w.p.x-=4; }
  });
  w.particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life--; });
  w.particles=w.particles.filter(p=>p.life>0);
}
function drawWorld(ctx,w,dw,dh){
  const T=w.T;
  const sx=dw/(COLS*CELL), sy=dh/(ROWS*CELL);
  ctx.setTransform(sx,0,0,sy,0,0);
  ctx.fillStyle=T.bg; ctx.fillRect(0,0,COLS*CELL,ROWS*CELL);
  const spin=w.t*(w.s.spin||8)*0.01;
  for(let i=0;i<w.tiles.length;i++){
    const t=w.tiles[i]; if(!t) continue;
    const x=(i%COLS)*CELL, y=Math.floor(i/COLS)*CELL;
    ctx.fillStyle=color(t,T);
    if(t===2){ ctx.beginPath(); ctx.moveTo(x,y+CELL); ctx.lineTo(x+CELL/2,y); ctx.lineTo(x+CELL,y+CELL); ctx.fill(); }
    else if(t===3){ ctx.save(); ctx.translate(x+CELL/2,y+CELL/2); ctx.rotate(w.s.nomove?0:spin); ctx.beginPath(); ctx.arc(0,0,CELL*0.28,0,6.28); ctx.fill(); ctx.restore(); }
    else ctx.fillRect(x+1,y+1,CELL-2,CELL-2);
  }
  w.enemies.forEach(en=>{ ctx.fillStyle='#ff8fab'; ctx.fillRect(en.x+2,en.y+2,CELL-4,CELL-4); });
  w.particles.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life/30); ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,3,3); ctx.globalAlpha=1; });
  ctx.fillStyle='#19d37e';
  ctx.fillRect(w.p.x,w.p.y,14,16);
  const hud=w.s.bigui?22:13;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#fff'; ctx.font=`${hud}px ui-monospace,Consolas,sans-serif`;
  const text=w.s.rtl? `${w.lives} lives  ${w.coins} coins` : `coins ${w.coins}   lives ${w.lives}`;
  ctx.fillText(text, 8, hud+4);
  if(w.win){ ctx.fillStyle='#19d37e'; ctx.fillText('EXIT', dw/2-20, dh/2); }
  if($('batt').value<15){ ctx.fillStyle='#d1675a'; ctx.fillText('LOW BATTERY', 8, dh-8); }
}

function inputFrom(keysMap, extra){
  return {
    left: !!(keysMap.ArrowLeft||keysMap.KeyA||(extra&&extra.left)),
    right:!!(keysMap.ArrowRight||keysMap.KeyD||(extra&&extra.right)),
    up: !!(keysMap.ArrowUp||keysMap.KeyW||keysMap.Space||(extra&&extra.up))
  };
}

function scaleFit(d, rot){
  const maxW=280, maxH=360;
  let w=d.w, h=d.h;
  if(rot) { const t=w; w=h; h=t; }
  const s=Math.min(maxW/w, maxH/h, 1);
  return {w:Math.round(w*s), h:Math.round(h*s)};
}

function mountEmu(devId, playerId){
  const d=DEVICES[devId]||DEVICES.pixel;
  const box=document.createElement('div');
  box.className='device '+d.kind;
  const size=scaleFit(d,false);
  box.innerHTML=`<span class="tag">${d.label}${playerId? ' P'+playerId:''}</span>
    <div class="bezel">
      <div class="notch"></div>
      <canvas width="${d.w}" height="${d.h}" style="width:${size.w}px;height:${size.h}px"></canvas>
      <div class="nav"><span>◁</span><span>○</span><span>□</span></div>
      <div class="pad">
        <span></span><button data-k="up">▲</button><span></span>
        <button data-k="left">◀</button><button data-k="up">●</button><button data-k="right">▶</button>
      </div>
    </div>`;
  $('emustage').appendChild(box);
  const canvas=box.querySelector('canvas');
  const pad={};
  box.querySelectorAll('.pad button').forEach(b=>{
    const k=b.dataset.k;
    b.onpointerdown=e=>{ e.preventDefault(); pad[k]=true; };
    b.onpointerup=()=>{ pad[k]=false; };
    b.onpointerleave=()=>{ pad[k]=false; };
  });
  const emu={ id:devId, d, box, canvas, ctx:canvas.getContext('2d'), pad, playerId:playerId||1, rot:false, world:makeWorld(spec()) };
  emus.push(emu);
  drawWorld(emu.ctx, emu.world, emu.canvas.width, emu.canvas.height);
  $('emuchip').textContent=emus.length+' emu';
  log('emulator '+d.label+' online (no system image)','ok','Emulator');
  return emu;
}
function clearEmus(){ emus.splice(0).forEach(e=>e.box.remove()); $('emuchip').textContent='0 emu'; }

function loop(ts){
  if(!playing) return;
  frames++;
  if(ts-lastFps>500){ fps=Math.round(frames*1000/(ts-lastFps)); frames=0; lastFps=ts; $('fpschip').textContent=fps+' fps'; }
  const freeze=$('freeze').checked;
  const net=$('net').value;
  const lag=net==='3g'?2:1;
  emus.forEach((emu,idx)=>{
    if(net==='off') emu.box.classList.add('offline'); else emu.box.classList.remove('offline');
    if($('cbmode').value) emu.box.classList.add('colorblind'); else emu.box.classList.remove('colorblind');
    const extra=emu.pad;
    let inp;
    if(emu.playerId===2) inp=inputFrom({KeyA:keys.KeyA,KeyD:keys.KeyD,KeyW:keys.KeyW}, extra);
    else inp=inputFrom(keys, extra);
    if(!freeze){
      if(replaying && ri<replay.length){ inp=replay[ri]; ri++; }
      else replay.push({left:inp.left,right:inp.right,up:inp.up});
      if(replay.length>60*60) replay.shift();
      stepWorld(emu.world, inp, lag);
    }
    emu.ctx.clearRect(0,0,emu.canvas.width,emu.canvas.height);
    drawWorld(emu.ctx, emu.world, emu.canvas.width, emu.canvas.height);
  });
  drawEditor();
  raf=requestAnimationFrame(loop);
}

function startRun(lab){
  playing=true; replay=[]; ri=0; replaying=false;
  $('play').hidden=true; $('stop').hidden=false;
  if(!emus.length || lab){
    if(lab){ clearEmus(); Object.keys(DEVICES).forEach(id=>mountEmu(id)); }
    else if(!emus.length) mountEmu($('devsel').value);
  }
  emus.forEach(e=>{ e.world=makeWorld(spec()); });
  log('ActivityManager: Start proc '+$('pkg').value+' for activity MainActivity','ok','ActivityManager');
  log(emus.length+' emulator(s) — Pixel/Fold/TV/Watch/Auto without downloading a system image. Google AVDs are 2GB+ each.','gold','MTStudio');
  lastFps=performance.now(); frames=0;
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
}
function stopRun(){
  playing=false; cancelAnimationFrame(raf);
  $('play').hidden=false; $('stop').hidden=true;
  log('ActivityManager: Force stopping '+$('pkg').value);
}

function gameHTML(){
  const s=spec();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${s.name}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>html,body{margin:0;background:#000;color:#fff;font-family:system-ui;touch-action:none}
canvas{display:block;margin:0 auto;background:#111;max-width:100%}
#hud{position:fixed;top:8px;left:8px;font:14px ui-monospace}
.pad{position:fixed;bottom:12px;left:12px;right:12px;display:flex;justify-content:space-between}
.pad b{width:56px;height:56px;border-radius:50%;background:#fff2;display:flex;align-items:center;justify-content:center}
</style></head><body>
<div id="hud"></div><canvas id="c"></canvas>
<div class="pad"><span><b id="L">◀</b> <b id="R">▶</b></span><b id="U">▲</b></div>
<script>
const COLS=${COLS},ROWS=${ROWS},CELL=24,tiles=${JSON.stringify(s.tiles)},G=${s.gravity},J=${s.jump};
const T=${JSON.stringify(THEMES[s.theme]||THEMES.night)};
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
cv.width=COLS*CELL;cv.height=ROWS*CELL;
let p={x:20,y:20,vx:0,vy:0},keys={},lives=${s.lives},coins=0,pad={};
const i=tiles.indexOf(4); if(i>=0){p.x=(i%COLS)*CELL+4;p.y=Math.floor(i/COLS)*CELL-16;}
function solid(x,y){const cx=Math.floor((x+7)/CELL),cy=Math.floor((y+15)/CELL);if(cx<0||cy>=ROWS)return 1;const t=tiles[cy*COLS+cx];return t===1||t===7||t===10;}
function cell(x,y){const cx=Math.floor((x+7)/CELL),cy=Math.floor((y+8)/CELL);if(cx<0||cy>=ROWS)return 0;return tiles[cy*COLS+cx];}
addEventListener('keydown',e=>keys[e.code]=true); addEventListener('keyup',e=>keys[e.code]=false);
['L','R','U'].forEach(id=>{const el=document.getElementById(id); const k=id==='U'?'up':id==='L'?'left':'right';
  el.ontouchstart=el.onpointerdown=e=>{e.preventDefault();pad[k]=1}; el.ontouchend=el.onpointerup=()=>pad[k]=0;});
function loop(){
  if(keys.ArrowLeft||keys.KeyA||pad.left)p.vx-=.4; if(keys.ArrowRight||keys.KeyD||pad.right)p.vx+=.4;
  p.vx*=.8; p.vy+=G; p.x+=p.vx; if(solid(p.x,p.y)){p.x-=p.vx;p.vx=0;} p.y+=p.vy;
  if(solid(p.x,p.y)){p.y-=p.vy;p.vy=0; if(keys.ArrowUp||keys.KeyW||keys.Space||pad.up)p.vy=J;}
  const h=cell(p.x,p.y);
  if(h===2||h===6){lives--; const i=tiles.indexOf(4);p.x=(i%COLS)*CELL+4;p.y=Math.floor(i/COLS)*CELL-16;p.vx=p.vy=0;}
  if(h===3){tiles[Math.floor((p.y+8)/CELL)*COLS+Math.floor((p.x+7)/CELL)]=0; coins++;}
  if(h===7&&(keys.ArrowUp||pad.up))p.vy=J*1.35;
  ctx.fillStyle=T.bg;ctx.fillRect(0,0,cv.width,cv.height);
  for(let i=0;i<tiles.length;i++){const t=tiles[i]; if(!t)continue; const x=(i%COLS)*CELL,y=(i/COLS|0)*CELL;
    ctx.fillStyle=['',T.ground,T.hazard,T.coin,'#fff',T.accent,'#ff8fab','#90e0ef','#a0c4e8','#7bed9f','#c4a574'][t];
    ctx.fillRect(x+1,y+1,CELL-2,CELL-2);}
  ctx.fillStyle='#19d37e'; ctx.fillRect(p.x,p.y,14,16);
  document.getElementById('hud').textContent='${s.name}  coins '+coins+'  lives '+lives;
  requestAnimationFrame(loop);
}
loop();
<\/script></body></html>`;
}

function slug(s){ return String(s||'game').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'')||'game'; }
function download(name, data, type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));
  a.download=name; a.click();
}

function showTab(id){
  document.querySelectorAll('#tabs button, #tree button[data-tab]').forEach(b=>b.classList.toggle('on', b.dataset.tab===id));
  ['design','anim','shop','store','a11y','html','manifest','gradle'].forEach(k=>{
    const el=$('pane-'+k); if(el) el.hidden = k!==id;
  });
  if(id==='html') $('pane-html').textContent=gameHTML();
  if(id==='manifest') $('pane-manifest').textContent=`<?xml version="1.0"?>
<manifest package="${$('pkg').value}">
  <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34"/>
  <application android:label="${spec().name}" android:versionName="${$('ver').value}">
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
  </application>
</manifest>`;
  if(id==='gradle') $('pane-gradle').textContent=`// Generated by MT Android Studio — you do not open this in Google’s IDE.
android {
  namespace '${$('pkg').value}'
  compileSdk 34
  defaultConfig {
    applicationId '${$('pkg').value}'
    versionName '${$('ver').value}'
    minSdk 24
  }
}
// Build APK in this window. Gradle is optional export only.`;
}

document.querySelectorAll('#tabs button, #tree button[data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
document.querySelectorAll('#tree button[data-dev]').forEach(b=>b.onclick=()=>{
  $('devsel').value=b.dataset.dev;
  mountEmu(b.dataset.dev);
  if(!playing) startRun(false);
});
document.querySelectorAll('#btabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#btabs button').forEach(x=>x.classList.toggle('on',x===b));
  blogTab=b.dataset.b; renderBlog();
});

$('name').oninput=()=>{ $('proj').textContent='app · '+$('name').value; };
$('play').onclick=()=>startRun(false);
$('stop').onclick=stopRun;
$('lab').onclick=()=>startRun(true);
$('twin').onclick=()=>{
  mountEmu($('devsel').value, 2);
  if(!playing) startRun(false);
  log('2nd player emulator — WASD vs arrows. Android Studio has no split-screen two-player game emu.','gold');
};
$('hot').onclick=()=>{
  const s=spec();
  emus.forEach(e=>{ const p=e.world.p; e.world=makeWorld(s); e.world.p=p; });
  log('hot reload applied to '+emus.length+' emulator(s) without restart','ok','InstantRun');
};
$('rotate').onclick=()=>{
  emus.forEach(e=>{
    e.rot=!e.rot;
    const t=e.canvas.width; e.canvas.width=e.canvas.height; e.canvas.height=t;
    const size=scaleFit(e.d, e.rot);
    e.canvas.style.width=size.w+'px'; e.canvas.style.height=size.h+'px';
  });
  log('configChanges orientation');
};
$('shake').onclick=()=>{
  emus.forEach(e=>{ e.box.style.transform='rotate(2deg)'; setTimeout(()=>e.box.style.transform='',200); if(e.world) e.world.p.vy=-6; });
  log('Sensor: accelerometer shake','ok','Sensors');
};
$('air').onclick=()=>{
  $('net').value = $('net').value==='off'?'wifi':'off';
  log('Airplane mode '+$('net').value);
};
$('batt').oninput=()=>{$('sens').textContent=`${$('net').value} · ${$('batt').value}% · GPS`;};
$('net').onchange=()=>{$('sens').textContent=`${$('net').value} · ${$('batt').value}% · GPS`; netLog.unshift('Connectivity: '+$('net').value);};

$('shot').onclick=()=>{
  const e=emus[0]; if(!e){ log('no emulator','bad'); return; }
  e.canvas.toBlob(b=>{
    download(slug(spec().name)+'-'+e.d.id+'.png', b, 'image/png');
    $('shots').textContent=($('shots').textContent||'')+' screenshot saved';
    log('screencap '+e.d.label,'ok','ddms');
  });
};
$('rec').onclick=async ()=>{
  const e=emus[0]; if(!e) return;
  if(rec){ rec.stop(); rec=null; $('rec').textContent='Record'; return; }
  const stream=e.canvas.captureStream(30);
  rec=new MediaRecorder(stream, {mimeType:'video/webm'});
  recChunks=[];
  rec.ondataavailable=ev=>{ if(ev.data.size) recChunks.push(ev.data); };
  rec.onstop=()=>download(slug(spec().name)+'.webm', new Blob(recChunks,{type:'video/webm'}), 'video/webm');
  rec.start();
  $('rec').textContent='Stop rec';
  log('recording emulator (MediaRecorder) — Android Studio needs scrcpy or a real AVD.','gold');
};
$('webplay').onclick=()=>{
  const url=URL.createObjectURL(new Blob([gameHTML()],{type:'text/html'}));
  window.open(url,'_blank');
  log('web play link opened — same build as the APK, no store wait. Android Studio cannot publish a playable web build from the Android module.','gold');
};

$('buildApk').onclick=async ()=>{
  const html=gameHTML(); const name=slug(spec().name);
  log('Gradle-less packager: injecting assets/index.html + v2/v3 sign');
  try{
    const res=await fetch('/build/apk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:spec().name,html,pkg:$('pkg').value,ver:$('ver').value})});
    if(!res.ok) throw new Error(await res.text()||res.status);
    const buf=await res.arrayBuffer();
    lastApk={name:name+'.apk', size:buf.byteLength};
    download(name+'.apk', new Blob([buf],{type:'application/vnd.android.package-archive'}), 'application/vnd.android.package-archive');
    log('BUILD SUCCESSFUL '+name+'.apk '+buf.byteLength+' bytes  signed v2+v3','ok','ApkSign');
    blogTab='apk'; document.querySelectorAll('#btabs button').forEach(b=>b.classList.toggle('on',b.dataset.b==='apk')); renderBlog();
  }catch(e){
    log('Build APK needs the Windows/Mac MT Android Studio app. '+e.message,'bad');
  }
};

function adb(cmd){
  const c=cmd.trim().toLowerCase();
  if(c==='help'||c==='emu help') log('devices | rotate | shake | airplane | twin | screenshot | record | lab');
  else if(c==='devices'||c==='emu devices') log(emus.map(e=>e.d.label+' device').join('\n')||'no devices');
  else if(c.includes('rotate')) $('rotate').click();
  else if(c.includes('shake')) $('shake').click();
  else if(c.includes('twin')) $('twin').click();
  else if(c.includes('lab')) $('lab').click();
  else if(c.includes('screen')) $('shot').click();
  else if(c.includes('record')) $('rec').click();
  else if(c.includes('airplane')) $('air').click();
  else log('unknown: '+cmd,'bad','adb');
}

addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup',e=>{ keys[e.code]=false; });

if(new URLSearchParams(location.search).get('mode')==='lab') startRun(true);
else { mountEmu('pixel'); drawEditor(); }
log('MT Android Studio '+location.host+' — device lab online. Features Google Android Studio does not have: instant skins (no AVD), 2-player emu, replay buffer, death heatmap, $MT shop, web play, Gradle-less APK.','gold');
renderBlog();
