'use strict';
const KEY='fenix_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const hoy=()=>fmt(new Date());
const addD=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return fmt(d)};
const dow=s=>parse(s).getDay();
const DIAS=['dom','lun','mar','mié','jue','vie','sáb'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const lindo=s=>{const d=parse(s);return DIAS[d.getDay()]+' '+d.getDate()+' de '+MESES[d.getMonth()]};

// ---------- estado ----------
let S;
function nuevo(){return{v:1,iniciado:false,inicio:null,habitos:[],mod:0,semIni:null,semFin:null,dias:{},revisiones:[],herr:{},hora:'07:30',modo:'min'}}
function cargar(){try{S=JSON.parse(localStorage.getItem(KEY))||nuevo()}catch(e){S=nuevo()}}
function guardar(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('No se pudo guardar','bad')}}
function dia(f){return S.dias[f]||(S.dias[f]={metas:[],preg:'',ideas:'',a1:'',a1ok:false,afirm:'',hab:{},logro:'',leccion:'',abc:[]})}
const metasOk=d=>d&&d.metas.filter(x=>x&&x.trim()).length>=3;
const habOk=d=>d&&S.habitos.some(h=>d.hab[h.id]);
const cumplido=f=>{const d=S.dias[f];return !!(d&&metasOk(d)&&d.a1ok&&habOk(d))};
const algo=f=>{const d=S.dias[f];return !!(d&&(d.metas.some(x=>x&&x.trim())||d.a1ok||habOk(d)||d.logro))};

function finSemana(ini){let e=addD(ini,6);while(dow(e)!==0)e=addD(e,1);return e}
function lunesDe(f){let d=f;while(dow(d)!==1)d=addD(d,-1);return d}
function cumplSemana(){let n=0;for(let f=S.semIni;f<=S.semFin;f=addD(f,1))if(cumplido(f))n++;return n}
function racha(){
 if(!S.inicio)return 0;
 let f=hoy(),n=0,miss=0;
 if(!cumplido(f))f=addD(f,-1);
 while(f>=S.inicio){
  if(cumplido(f)){n++;miss=0}else{miss++;if(miss>=2)break}
  f=addD(f,-1);
 }
 return n;
}
function enPeligro(){const a=addD(hoy(),-1);return S.inicio&&a>=S.inicio&&!cumplido(a)&&!cumplido(hoy())}
const habPermitidos=()=>3+S.revisiones.length;
const fichaDelDia=()=>{const f=hoy();let h=0;for(const c of f)h=(h*31+c.charCodeAt(0))>>>0;return FICHAS[h%FICHAS.length]};

function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),300)},1400)}

// ---------- navegación ----------
let vista='hoy',sub=null,calMes=null;
function ir(v,s=null){vista=v;sub=s;render();window.scrollTo(0,0)}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>ir(b.dataset.v));
function render(){
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===vista));
 $('#nav').classList.toggle('hide',!S.iniciado);
 const app=$('#app');
 if(!S.iniciado){app.innerHTML=vInicio();bindInicio();return}
 ({hoy:vHoy,plan:vPlan,herr:vHerr,hist:vHist,ajus:vAjus})[vista]();
}

// ---------- bienvenida ----------
function vInicio(){
 return `<h1>🔥 Seminario Fénix</h1><p class="mut">Constancia diaria, 5 a 15 minutos. Un módulo por semana.</p>
 <div class="card"><h2>Elegí tus 3 hábitos para arrancar</h2><p class="mut">Después podés sumar uno por semana.</p>
 ${HABITOS_SUG.map((h,i)=>`<label class="chk"><input type="checkbox" value="${i}" class="hsel"> ${esc(h)}</label>`).join('')}
 <input type="text" id="hcus" placeholder="O escribí uno propio…">
 <p class="mut" id="hcnt">Elegidos: 0/3</p></div>
 <div class="card"><h2>Hora fija del check-in</h2><input type="time" id="hora" value="${S.hora}" style="width:100%;padding:10px;background:var(--card2);color:var(--tx);border:1px solid var(--line);border-radius:10px">
 <p class="mut">Poné una alarma en el celu a esa hora.</p></div>
 <button class="pri full" id="empezar" disabled>Empezar hoy</button>
 <p class="mut" style="text-align:center;margin-top:12px">¿Tenés un respaldo? <a href="#" id="impIni" style="color:var(--ac)">Importalo</a><input type="file" id="fimp" accept=".json,application/json" class="hide"></p>`;
}
function bindInicio(){
 const upd=()=>{const n=[...document.querySelectorAll('.hsel:checked')].length+($('#hcus').value.trim()?1:0);$('#hcnt').textContent='Elegidos: '+n+'/3';$('#empezar').disabled=n!==3};
 document.querySelectorAll('.hsel').forEach(c=>c.onchange=upd);$('#hcus').oninput=upd;
 $('#empezar').onclick=()=>{
  const hs=[...document.querySelectorAll('.hsel:checked')].map(c=>HABITOS_SUG[c.value]);
  if($('#hcus').value.trim())hs.push($('#hcus').value.trim());
  S.habitos=hs.map((n,i)=>({id:'h'+Date.now()+i,n}));
  S.hora=$('#hora').value||S.hora;S.inicio=hoy();S.semIni=hoy();S.semFin=finSemana(hoy());S.iniciado=true;guardar();
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
  ir('hoy');
 };
 $('#impIni').onclick=e=>{e.preventDefault();$('#fimp').click()};$('#fimp').onchange=importar;
}

// ---------- HOY ----------
function vHoy(){
 const f=hoy(),d=dia(f),min=S.modo==='min',M=MODULOS[Math.min(S.mod,25)],fin=S.mod>25;
 const c=cumplSemana(),r=racha(),nMet=min?3:10,nIdeas=min?5:20;
 const revisar=f>=S.semFin;
 const metasPrev=(S.dias[addD(f,-1)]||{}).metas||[];
 let h=`<div class="row sp"><div><h1>Hoy</h1><div class="mut">${lindo(f)}</div></div>
 <div style="text-align:right"><div class="big">${r}🔥</div><div class="mut">días de racha</div></div></div>`;
 if(enPeligro())h+=`<div class="ojo">⚠️ Ayer quedó en cero. <b>Hoy no puede quedar en cero</b> o se corta la racha. Hacé la versión mínima.</div>`;
 h+=fin?`<div class="card mod"><h2>🎓 Terminaste los 26 módulos</h2><p class="mut">Seguí con la rutina diaria. Podés repasar cualquier módulo en Plan.</p></div>`:
 `<div class="card mod" id="irMod" style="cursor:pointer"><div class="row sp"><span class="pill">Semana ${S.revisiones.length+1} · M${M.n}</span><span class="mut">hasta el ${lindo(S.semFin)}</span></div>
 <h2 style="margin-top:8px">${esc(M.t)}</h2><p class="mut">${esc(M.ej)}</p>
 <div class="row sp"><span class="mut">Días cumplidos: <b>${c}</b> / 7 (mínimo 5)</span></div><div class="bar"><i style="width:${Math.min(100,c/7*100)}%"></i></div></div>`;
 if(revisar)h+=vRevision();
 h+=`<div class="tog"><button data-m="min" class="${min?'on':''}">⚡ Mínimo 5 min</button><button data-m="full" class="${min?'':'on'}">Completo</button></div>`;
 h+=`<div class="card" id="estado"></div>`;
 // mañana
 h+=`<div class="card"><h2>☀️ Mañana</h2><h3>${min?'3':'10'} metas, en presente</h3><p class="mut">Escribilas de nuevo cada día, como si ya fueran realidad ("Yo gano…", "Yo soy…").</p>`;
 for(let i=0;i<nMet;i++)h+=`<input type="text" data-meta="${i}" value="${esc(d.metas[i]||'')}" placeholder="${esc(metasPrev[i]?'Ayer: '+metasPrev[i]:'Meta '+(i+1))}">`;
 if(!min){
  h+=`<h3>Pregunta del día (método de las ${nIdeas} ideas)</h3><input type="text" data-k="preg" value="${esc(d.preg)}" placeholder="¿Cómo puedo…?">
  <textarea data-k="ideas" placeholder="Una idea por línea" style="min-height:120px">${esc(d.ideas)}</textarea><p class="mut" id="cIdeas"></p>
  <h3>Afirmación</h3><input type="text" data-k="afirm" value="${esc(d.afirm)}" placeholder="${S.mod===2?'Me agrado a mí mismo':S.mod===17?'Soy un genio':'Me agrado a mí mismo · Soy responsable'}">`;
 }
 h+=`<h3>Tarea A1</h3>`;
 const lista=d.abc.filter(x=>x.t&&x.t.trim());
 if(lista.length)h+=`<div class="mut" style="margin-bottom:6px">Tu lista de anoche:<br>${lista.sort((a,b)=>a.l.localeCompare(b.l)).map(x=>`<b>${x.l}</b> ${esc(x.t)}`).join('<br>')}</div>`;
 const a1sug=(lista.find(x=>x.l==='A1')||lista.find(x=>x.l[0]==='A')||{}).t||'';
 h+=`<input type="text" data-k="a1" value="${esc(d.a1||a1sug)}" placeholder="La tarea más importante del día">
 <label class="chk"><input type="checkbox" id="a1ok" ${d.a1ok?'checked':''}> <b>A1 terminada</b> &nbsp;<span class="mut">No toques nada más hasta terminarla</span></label></div>`;
 // hábitos
 h+=`<div class="card"><h2>✅ Hábitos</h2>${S.habitos.map(x=>`<label class="chk"><input type="checkbox" data-h="${x.id}" ${d.hab[x.id]?'checked':''}> ${esc(x.n)}</label>`).join('')}</div>`;
 // noche
 if(!min){
  const man=dia(addD(f,1));if(!man.abc.length)man.abc=[{l:'A1',t:''},{l:'A2',t:''},{l:'B1',t:''}];
  h+=`<div class="card"><h2>🌙 Noche</h2><h3>Un logro de hoy</h3><input type="text" data-k="logro" value="${esc(d.logro)}">
  <h3>Una lección</h3><input type="text" data-k="leccion" value="${esc(d.leccion)}">
  <h3>Lista ABCDE de mañana</h3><p class="mut">A imprescindible · B secundaria · C opcional · D delegar · E eliminar</p><div id="abcBox">${abcRows(man.abc)}</div>
  <button class="sm" id="abcAdd">+ tarea</button></div>`;
 }else{
  h+=`<div class="card"><h2>🌙 Noche (rápido)</h2><h3>Un logro de hoy</h3><input type="text" data-k="logro" value="${esc(d.logro)}"><p class="mut">Para armar la lista ABCDE de mañana pasá a "Completo".</p></div>`;
 }
 h+=`<div class="card"><h2>🃏 Ficha del día</h2><p class="ficha">${esc(fichaDelDia())}</p><p class="mut">Durante el día: "¡Hazlo ahora!" · "¿Cuál es el uso más valioso de mi tiempo ahora?" · "Soy responsable".</p></div>`;
 $('#app').innerHTML=h;
 bindHoy(f);
}
const LETRAS=['A1','A2','A3','B1','B2','B3','C','D','E'];
function abcRows(a){return a.map((x,i)=>`<div class="abc"><select data-al="${i}">${LETRAS.map(l=>`<option ${l===x.l?'selected':''}>${l}</option>`).join('')}</select><input type="text" data-at="${i}" value="${esc(x.t)}" placeholder="Tarea"></div>`).join('')}
function estadoHoy(f){
 const d=dia(f),el=$('#estado');if(!el)return;
 const ok=cumplido(f);
 const falta=[];if(!metasOk(d))falta.push('3 metas');if(!d.a1ok)falta.push('A1 terminada');if(!habOk(d))falta.push('1 hábito');
 el.innerHTML=ok?`<b style="color:var(--ok)">✓ Día cumplido.</b> <span class="mut">Lo que sumes ahora es extra.</span>`:`<b>Para cumplir el día te falta:</b> ${falta.join(' · ')}`;
 const ci=$('#cIdeas');if(ci){const n=d.ideas.split('\n').filter(x=>x.trim()).length;ci.textContent=n+' / 20 ideas'}
}
function bindHoy(f){
 const d=dia(f);
 const m=$('#irMod');if(m)m.onclick=()=>ir('plan',Math.min(S.mod,25));
 document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{S.modo=b.dataset.m;guardar();render()});
 document.querySelectorAll('[data-meta]').forEach(i=>i.oninput=()=>{d.metas[+i.dataset.meta]=i.value;guardar();estadoHoy(f)});
 document.querySelectorAll('[data-k]').forEach(i=>i.oninput=()=>{d[i.dataset.k]=i.value;guardar();estadoHoy(f)});
 $('#a1ok').onchange=e=>{d.a1ok=e.target.checked;if(!d.a1){d.a1=document.querySelector('[data-k=a1]').value}guardar();estadoHoy(f);if(d.a1ok)toast('¡A1 terminada!')};
 document.querySelectorAll('[data-h]').forEach(i=>i.onchange=()=>{d.hab[i.dataset.h]=i.checked;guardar();estadoHoy(f)});
 const man=S.dias[addD(f,1)];
 const bindAbc=()=>{
  document.querySelectorAll('[data-al]').forEach(s=>s.onchange=()=>{man.abc[+s.dataset.al].l=s.value;guardar()});
  document.querySelectorAll('[data-at]').forEach(i=>i.oninput=()=>{man.abc[+i.dataset.at].t=i.value;guardar()});
 };
 if($('#abcAdd')){bindAbc();$('#abcAdd').onclick=()=>{man.abc.push({l:'B1',t:''});$('#abcBox').innerHTML=abcRows(man.abc);bindAbc();guardar()}}
 bindRevision();
 estadoHoy(f);
}

// ---------- revisión semanal ----------
function vRevision(){
 const c=cumplSemana(),pct=Math.round(c/7*100),ok=c>=5;
 return `<div class="card" style="border-color:var(--ac)"><h2>🗓️ Revisión semanal (10 min)</h2>
 <p>Cumpliste <b>${c} de 7</b> días (${pct}%). ${ok?'<b style="color:var(--ok)">Podés avanzar al módulo siguiente.</b>':'<b style="color:var(--warn)">Te faltaron días: esta semana se repite.</b>'}</p>
 <h3>Puntaje de la semana</h3><div class="rng"><input type="range" min="1" max="10" value="6" id="rvS"><b id="rvSv">6</b></div>
 <h3>¿Qué funcionó?</h3><textarea id="rvF"></textarea>
 <h3>¿Qué ajusto?</h3><textarea id="rvA"></textarea>
 <div class="row" style="margin-top:8px"><button class="pri" style="flex:1" id="rvAv" ${ok?'':'disabled'}>Avanzar</button><button style="flex:1" id="rvRe">Repetir semana</button></div></div>`;
}
function bindRevision(){
 if(!$('#rvS'))return;
 $('#rvS').oninput=e=>$('#rvSv').textContent=e.target.value;
 const cerrar=dec=>{
  const c=cumplSemana();
  S.revisiones.push({ini:S.semIni,fin:S.semFin,mod:S.mod,cumpl:c,pct:Math.round(c/7*100),score:+$('#rvS').value,fun:$('#rvF').value,aju:$('#rvA').value,dec});
  if(dec==='avanzar')S.mod++;
  let ni=addD(S.semFin,1);const lh=lunesDe(hoy());if(ni<lh)ni=lh;
  S.semIni=ni;
  S.semFin=addD(S.semIni,6);
  guardar();toast(dec==='avanzar'?'¡Módulo nuevo desbloqueado!':'Semana nueva, mismo módulo');render();
 };
 $('#rvAv').onclick=()=>cerrar('avanzar');$('#rvRe').onclick=()=>cerrar('repetir');
}

// ---------- PLAN ----------
function vPlan(){
 if(sub!==null)return vFicha(sub);
 let h=`<h1>Plan de 26 semanas</h1><p class="mut">Se desbloquea un módulo por semana cumpliendo al menos 5 de 7 días.</p><div class="card list">`;
 let bloque='';
 MODULOS.forEach((m,i)=>{
  if(m.b!==bloque){bloque=m.b;h+=`<div class="mut" style="padding:10px 10px 2px;font-weight:700">${esc(bloque)}</div>`}
  const st=i<S.mod?'✅':i===S.mod?'▶️':'🔒';
  h+=`<div class="it ${i>S.mod?'lock':''}" data-i="${i}">${st} <b>M${m.n}</b> · ${esc(m.t)}</div>`;
 });
 h+=`<div class="mut" style="padding:10px 10px 2px;font-weight:700">Extra</div><div class="it" data-x="1">⭐ ${esc(EXTRA_10CLAVES.t)}</div>`;
 h+='</div>';$('#app').innerHTML=h;
 document.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>ir('plan',+e.dataset.i));
 document.querySelectorAll('[data-x]').forEach(e=>e.onclick=()=>ir('plan','x'));
}
function vFicha(i){
 const x=i==='x',m=x?EXTRA_10CLAVES:MODULOS[i];let h=`<button class="back" id="vol">‹ Plan</button><span class="pill">${esc(m.b)}</span><h1>${x?'':'M'+m.n+' · '}${esc(m.t)}</h1>`;
 if(!x&&i>S.mod){h+=`<div class="card">🔒 Se desbloquea cuando completes las semanas anteriores (5 de 7 días cada una).</div>`}
 else{
  h+=`<div class="card"><h3>💡 Idea</h3><p>${esc(m.idea)}</p><h3>🛠️ Herramienta</h3><p>${esc(m.herr)}</p>${m.tool?`<button class="pri sm" id="abrT">Abrir herramienta</button>`:''}
  <h3>🎯 Ejercicio de la semana</h3><p>${esc(m.ej)}</p>
  ${m.prac?`<h3>🧩 En la práctica (resumen complementario)</h3><ol style="margin:4px 0;padding-left:20px">${m.prac.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}
  ${m.ojo?`<div class="ojo"><b>⚠ Ojo:</b> ${esc(m.ojo)}</div>`:''}${m.ok?`<div class="okb"><b>✓ Respaldado:</b> ${esc(m.ok)}</div>`:''}</div>`;
 }
 $('#app').innerHTML=h;$('#vol').onclick=()=>ir('plan');
 if($('#abrT'))$('#abrT').onclick=()=>ir('herr',{id:m.tool});
}

// ---------- HERRAMIENTAS ----------
function vHerr(){
 if(sub&&sub.id)return vTool(sub.id,sub.idx);
 let h=`<h1>Herramientas</h1><p class="mut">Se guardan con fecha. Las metas del día, las 20 ideas y la lista de mañana están en Hoy.</p><div class="card list">`;
 for(const[id,t]of Object.entries(HERRAMIENTAS)){const n=(S.herr[id]||[]).length;h+=`<div class="it" data-t="${id}"><b>${esc(t.t)}</b> <span class="mut">· ${t.m}${n?' · '+n+' guardada'+(n>1?'s':''):''}</span></div>`}
 h+='</div>';$('#app').innerHTML=h;
 document.querySelectorAll('[data-t]').forEach(e=>e.onclick=()=>ir('herr',{id:e.dataset.t}));
}
function vTool(id,idx){
 const T=HERRAMIENTAS[id],arr=S.herr[id]||[],ed=idx!=null?arr[idx]:null,v=ed?ed.v:{};
 let h=`<button class="back" id="vol">‹ Herramientas</button><h1>${esc(T.t)}</h1><p class="mut">${esc(T.d)}${ed?' · Guardada el '+lindo(ed.f):''}</p><div class="card">`;
 T.f.forEach(([lab,tp],k)=>{
  const val=v[k]??'';
  h+=`<h3>${esc(lab)}${T.timer?` <button class="sm" data-tm="${k}">⏱ ${T.timer}s</button>`:''}</h3>`;
  if(tp==='r')h+=`<div class="rng"><input type="range" min="1" max="10" value="${val||5}" data-f="${k}"><b>${val||5}</b></div>`;
  else if(tp==='t')h+=`<input type="text" data-f="${k}" value="${esc(val)}">`;
  else if(tp[0]==='l')h+=`<textarea data-f="${k}" style="min-height:${tp==='l20'?220:160}px" placeholder="Una por línea">${esc(val)}</textarea><p class="mut" data-c="${k}"></p>`;
  else h+=`<textarea data-f="${k}">${esc(val)}</textarea>`;
 });
 h+=`<div id="resumen"></div><div class="row" style="margin-top:10px"><button class="pri" style="flex:1" id="guar">${ed?'Guardar cambios':'Guardar'}</button>${ed?'<button id="nue">Nueva</button>':''}</div></div>`;
 if(arr.length){h+=`<div class="card list"><h2>Guardadas</h2>${arr.map((e,i)=>({e,i})).reverse().map(({e,i})=>`<div class="it row sp"><span data-o="${i}" style="flex:1">${lindo(e.f)} · <span class="mut">${esc(String(e.v[0]??'').slice(0,40))}</span></span><button class="sm" data-del="${i}">🗑</button></div>`).join('')}</div>`}
 $('#app').innerHTML=h;
 const leer=()=>{const o={};document.querySelectorAll('[data-f]').forEach(e=>o[e.dataset.f]=e.type==='range'?+e.value:e.value);return o};
 const resumen=()=>{
  const o=leer(),rs=T.f.map((f,k)=>[f[0],f[1],o[k]]).filter(x=>x[1]==='r');
  document.querySelectorAll('[data-c]').forEach(p=>{const t=document.querySelector(`[data-f="${p.dataset.c}"]`);p.textContent=t.value.split('\n').filter(x=>x.trim()).length+' líneas'});
  if(!rs.length)return;
  const mn=Math.min(...rs.map(x=>x[2])),mx=Math.max(...rs.map(x=>x[2]));
  const prom=(rs.reduce((a,x)=>a+x[2],0)/rs.length).toFixed(1);
  let txt=id==='estres'?`Lo que más pesa: <b>${rs.filter(x=>x[2]===mx).map(x=>esc(x[0])).join(', ')}</b>`:`Más bajo: <b>${rs.filter(x=>x[2]===mn).map(x=>esc(x[0])).join(', ')}</b>`;
  if(id==='flexibilidad')txt=`Promedio ${prom}/10. ${prom>=7?'Personalidad adaptable.':'Para trabajar: '+rs.filter(x=>x[2]===mn).map(x=>esc(x[0])).join(', ')}`;
  $('#resumen').innerHTML=`<div class="okb">${txt} · promedio ${prom}</div>`;
 };
 document.querySelectorAll('input[type=range][data-f]').forEach(r=>r.oninput=()=>{r.nextElementSibling.textContent=r.value;resumen()});
 document.querySelectorAll('textarea[data-f]').forEach(t=>t.oninput=resumen);
 resumen();
 $('#vol').onclick=()=>ir('herr');
 $('#guar').onclick=()=>{S.herr[id]=S.herr[id]||[];if(ed)ed.v=leer();else S.herr[id].push({f:hoy(),v:leer()});guardar();toast('Guardado');ir('herr',{id,idx:ed?idx:S.herr[id].length-1})};
 if($('#nue'))$('#nue').onclick=()=>ir('herr',{id});
 document.querySelectorAll('[data-o]').forEach(e=>e.onclick=()=>ir('herr',{id,idx:+e.dataset.o}));
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('¿Borrar esta entrada?')){S.herr[id].splice(+b.dataset.del,1);guardar();ir('herr',{id})}});
 let tmr=null;
 document.querySelectorAll('[data-tm]').forEach(b=>b.onclick=()=>{
  clearInterval(tmr);document.querySelectorAll('[data-tm]').forEach(x=>x.textContent='⏱ '+T.timer+'s');
  let s=T.timer;const ta=document.querySelector(`[data-f="${b.dataset.tm}"]`);ta.focus();
  tmr=setInterval(()=>{s--;b.textContent='⏱ '+s+'s';if(s<=0){clearInterval(tmr);b.textContent='✓ listo';if(navigator.vibrate)navigator.vibrate(200)}},1000);
 });
}

// ---------- HISTORIAL ----------
function vHist(){
 const f=hoy();if(!calMes)calMes=f.slice(0,7);
 const[y,mo]=calMes.split('-').map(Number),first=new Date(y,mo-1,1),dim=new Date(y,mo,0).getDate();
 let h=`<h1>Historial</h1>`;
 // porcentajes
 const c=cumplSemana();
 let mc=0,md=0;for(let i=1;i<=dim;i++){const s=calMes+'-'+pad(i);if(s>f||s<S.inicio)continue;md++;if(cumplido(s))mc++}
 let tc=0,td=0;for(let s=S.inicio;s<=f;s=addD(s,1)){td++;if(cumplido(s))tc++}
 h+=`<div class="card"><div class="row sp"><div><div class="big">${Math.round(c/7*100)}%</div><div class="mut">semana (${c}/7)</div></div><div><div class="big">${md?Math.round(mc/md*100):0}%</div><div class="mut">${MESES[mo-1]} (${mc}/${md})</div></div><div><div class="big">${racha()}🔥</div><div class="mut">racha</div></div></div>
 <p class="mut">Desde que empezaste: ${tc} de ${td} días cumplidos.</p></div>`;
 h+=`<div class="card"><div class="row sp"><button class="sm" id="mPrev">‹</button><b>${MESES[mo-1]} ${y}</b><button class="sm" id="mNext">›</button></div><div class="cal" style="margin-top:10px">`;
 ['L','M','M','J','V','S','D'].forEach(x=>h+=`<div class="h">${x}</div>`);
 const off=(first.getDay()+6)%7;for(let i=0;i<off;i++)h+='<div class="e"></div>';
 for(let i=1;i<=dim;i++){const s=calMes+'-'+pad(i);h+=`<div class="${cumplido(s)?'ok':algo(s)?'pa':''} ${s===f?'hoy':''}">${i}</div>`}
 h+=`</div><p class="mut">Verde: cumplido · Marrón: algo hecho, sin llegar al mínimo.</p></div>`;
 const ll=Object.entries(S.dias).filter(([k,d])=>d.logro||d.leccion).sort((a,b)=>b[0].localeCompare(a[0]));
 h+=`<div class="card"><h2>🏆 Logros y lecciones</h2>${ll.length?ll.map(([k,d])=>`<p><span class="mut">${lindo(k)}</span><br>${d.logro?'🏆 '+esc(d.logro):''}${d.logro&&d.leccion?'<br>':''}${d.leccion?'📘 '+esc(d.leccion):''}</p>`).join(''):'<p class="mut">Todavía no hay. Se cargan en el check-in de la noche.</p>'}</div>`;
 if(S.revisiones.length)h+=`<div class="card"><h2>🗓️ Revisiones semanales</h2>${S.revisiones.slice().reverse().map((r,i)=>`<p><b>Semana ${S.revisiones.length-i} · M${MODULOS[Math.min(r.mod,25)].n}</b> — ${r.cumpl}/7 · ${r.score}/10 · ${r.dec==='avanzar'?'avanzó':'repitió'}${r.fun?'<br><span class="mut">Funcionó:</span> '+esc(r.fun):''}${r.aju?'<br><span class="mut">Ajuste:</span> '+esc(r.aju):''}</p>`).join('')}</div>`;
 $('#app').innerHTML=h;
 const mv=n=>{const d=new Date(y,mo-1+n,1);calMes=d.getFullYear()+'-'+pad(d.getMonth()+1);render()};
 $('#mPrev').onclick=()=>mv(-1);$('#mNext').onclick=()=>mv(1);
}

// ---------- AJUSTES ----------
function vAjus(){
 const perm=habPermitidos(),puede=S.habitos.length<perm;
 let h=`<h1>Ajustes</h1><div class="card"><h2>Hábitos (${S.habitos.length}/${perm})</h2><p class="mut">Arrancás con 3 y se habilita uno más por cada semana revisada.</p>
 ${S.habitos.map(x=>`<div class="row" style="margin:6px 0"><input type="text" data-hn="${x.id}" value="${esc(x.n)}"><button class="sm" data-hx="${x.id}">✕</button></div>`).join('')}
 ${puede?`<select id="hsug"><option value="">Sumar un hábito…</option>${HABITOS_SUG.filter(s=>!S.habitos.some(x=>x.n===s)).map(s=>`<option>${esc(s)}</option>`).join('')}<option value="__">Otro (escribirlo)</option></select>`:`<p class="mut">El próximo hábito se habilita después de la revisión del domingo.</p>`}</div>
 <div class="card"><h2>Check-in</h2><input type="time" id="hora" value="${S.hora}" style="width:100%;padding:10px;background:var(--card2);color:var(--tx);border:1px solid var(--line);border-radius:10px"><p class="mut">Poné una alarma diaria en el celu a esta hora. La app no puede avisarte sola.</p></div>
 <div class="card"><h2>Respaldo</h2><p class="mut">Los datos quedan guardados en este celu. Exportá un respaldo cada tanto (por ejemplo, en la revisión del domingo).</p>
 <div class="row"><button class="pri" style="flex:1" id="exp">Exportar</button><button style="flex:1" id="imp">Importar</button></div><input type="file" id="fimp" accept=".json,application/json" class="hide">
 <p class="mut" id="almac"></p></div>
 <div class="card"><h2>Instalar</h2><p class="mut">Android (Chrome/Brave): menú ⋮ → "Instalar app" o "Agregar a pantalla principal". iPhone (Safari): Compartir → "Agregar a inicio".</p></div>
 <div class="card"><button class="full" id="reset" style="color:var(--bad)">Borrar todo y empezar de cero</button></div>
 <p class="mut" style="text-align:center">Seminario Fénix · Brian Tracy · v2</p>`;
 $('#app').innerHTML=h;
 document.querySelectorAll('[data-hn]').forEach(i=>i.oninput=()=>{S.habitos.find(x=>x.id===i.dataset.hn).n=i.value;guardar()});
 document.querySelectorAll('[data-hx]').forEach(b=>b.onclick=()=>{if(confirm('¿Quitar este hábito? Lo ya marcado queda en el historial.')){S.habitos=S.habitos.filter(x=>x.id!==b.dataset.hx);guardar();render()}});
 if($('#hsug'))$('#hsug').onchange=e=>{let n=e.target.value;if(n==='__')n=(prompt('Nuevo hábito:')||'').trim();if(n){S.habitos.push({id:'h'+Date.now(),n});guardar();toast('Hábito sumado')}render()};
 $('#hora').onchange=e=>{S.hora=e.target.value;guardar();toast('Guardado')};
 $('#exp').onclick=exportar;$('#imp').onclick=()=>$('#fimp').click();$('#fimp').onchange=importar;
 $('#reset').onclick=()=>{if(confirm('¿Borrar TODO? Exportá un respaldo antes.')&&confirm('¿Seguro? No se puede deshacer.')){S=nuevo();guardar();ir('hoy')}};
 if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{$('#almac').textContent=p?'✓ Guardado persistente activado.':'Guardado normal (instalá la app para que sea persistente).'});
}
function exportar(){
 const b=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(b);a.download='fenix-respaldo-'+hoy()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Respaldo descargado');
}
function importar(e){
 const file=e.target.files[0];if(!file)return;const r=new FileReader();
 r.onload=()=>{try{const o=JSON.parse(r.result);if(!o||o.v!==1||!o.dias)throw 0;if(S.iniciado&&!confirm('Esto reemplaza los datos actuales por los del respaldo. ¿Seguir?'))return;S=o;guardar();toast('Respaldo importado');ir('hoy')}catch(x){alert('El archivo no es un respaldo válido de Fénix.')}};
 r.readAsText(file);
}

// ---------- arranque ----------
cargar();
if(S.iniciado&&S.semFin&&hoy()>addD(S.semFin,6)){/* semanas sin revisar: la revisión aparece en Hoy */}
render();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&vista==='hoy'&&!document.activeElement.matches('input,textarea'))render()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
