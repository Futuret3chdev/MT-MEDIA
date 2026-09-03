window.MT = {
  root: (location.pathname.indexOf('/maker')===0 || location.pathname.indexOf('/studios')===0)
    ? (location.pathname.indexOf('/maker')===0 ? '/maker' : '/studios')
    : '',
  nav(current){
    const items=[
      ['Launcher','index.html'],
      ['Android','android.html'],
      ['Device Lab','lab.html'],
      ['iOS','ios.html'],
      ['Assets','assets.html'],
      ['Publisher','publisher.html'],
      ['Play Console','console.html'],
      ['Bot','bot.html'],
      ['World 3D','world.html'],
      ['Shield','shield.html'],
      ['Music','music.html'],
      ['Video','video.html'],
      ['Photo','photo.html']
    ];
    const base = location.pathname.includes('/studios/') || location.pathname.endsWith('/studios')
      ? '/studios/'
      : (this.root==='/maker' ? '/studios/' : './');
    return items.map(([n,h])=>{
      const href = base=== './' ? h : (base + h);
      const on = current && h.startsWith(current) ? 'on' : '';
      return `<a class="${on}" href="${href}">${n}</a>`;
    }).join('');
  },
  get(k, d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
  project(){ return this.get('mt-project', { name:'Night Run', tiles:null, html:null }); },
  saveProject(p){ this.set('mt-project', p); },
  async api(path, opt){
    const r = await fetch(path, Object.assign({ credentials:'include', headers:{'Content-Type':'application/json'} }, opt||{}));
    const t = await r.text();
    try{ return JSON.parse(t); }catch{ return { ok:false, error:t||r.status }; }
  },
  download(name, data, type){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:type||'text/plain'}));
    a.download=name; a.click();
  },
  crc32(data){
    if(!this._crc){ const t=new Uint32Array(256); for(let i=0;i<256;i++){ let c=i; for(let k=0;k<8;k++) c=c&1?0xedb88320^(c>>>1):c>>>1; t[i]=c>>>0;} this._crc=t; }
    let crc=0xffffffff; for(let i=0;i<data.length;i++) crc=this._crc[(crc^data[i])&255]^(crc>>>8); return (crc^0xffffffff)>>>0;
  },
  zip(files){
    const enc=new TextEncoder();
    const u16=n=>{const b=new Uint8Array(2); new DataView(b.buffer).setUint16(0,n,true); return b;};
    const u32=n=>{const b=new Uint8Array(4); new DataView(b.buffer).setUint32(0,n,true); return b;};
    const chunks=[], central=[]; let offset=0;
    for(const f of files){
      const name=enc.encode(f.name.replace(/\\/g,'/'));
      const data=typeof f.data==='string'?enc.encode(f.data):f.data;
      const crc=this.crc32(data);
      const local=[u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data];
      chunks.push(...local);
      central.push(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name);
      offset+=30+name.length+data.length;
    }
    const centralStart=offset; let centralSize=0;
    for(const c of central){ chunks.push(c); centralSize+=c.length; }
    const n=files.length;
    chunks.push(u32(0x06054b50),u16(0),u16(0),u16(n),u16(n),u32(centralSize),u32(centralStart),u16(0));
    const total=chunks.reduce((s,p)=>s+p.length,0); const out=new Uint8Array(total); let o=0;
    for(const p of chunks){ out.set(p,o); o+=p.length; }
    return out;
  }
};
