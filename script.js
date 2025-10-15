console.log("script.js v5: start");

// ===== Kalkulačka bez eval (beze změn) =====
function tokenize(expr){const t=[];let i=0;while(i<expr.length){const c=expr[i];if(/\s/.test(c)){i++;continue}if(/[0-9.]/.test(c)){let n=c;i++;while(i<expr.length&&/[0-9.]/.test(expr[i])){n+=expr[i++]}t.push({type:"num",value:n});continue}if(/[+\-*/()]/.test(c)){t.push({type:"op",value:c});i++;continue}return null}return t}
function normalizeUnary(e){let o=e.replace(/\s+/g,"");o=o.replace(/^\-/,"0-");o=o.replace(/\(\-/g,"(0-");return o}
function toRPN(tok){const out=[],st=[];const prec={"+":1,"-":1,"*":2,"/":2};for(const x of tok){if(x.type==="num"){out.push(x)}else if(/[+\-*/]/.test(x.value)){while(st.length){const top=st[st.length-1];if(/[+\-*/]/.test(top.value)&&prec[x.value]<=prec[top.value]){out.push(st.pop())}else break}st.push(x)}else if(x.value==="("){st.push(x)}else if(x.value===")"){let f=false;while(st.length){const top=st.pop();if(top.value==="("){f=true;break}out.push(top)}if(!f)return null}}while(st.length){const top=st.pop();if(top.value==="("||top.value===")")return null;out.push(top)}return out}
function evalRPN(rpn){const st=[];for(const x of rpn){if(x.type==="num"){st.push(parseFloat(x.value))}else{const b=st.pop(),a=st.pop();if(a===undefined||b===undefined)return NaN;if(x.value==="+")st.push(a+b);else if(x.value==="-")st.push(a-b);else if(x.value==="*")st.push(a*b);else if(x.value==="/")st.push(b===0?NaN:a/b)}}return st.length===1?st[0]:NaN}
function safeCalc(expr){const n=normalizeUnary(expr);const tok=tokenize(n);if(!tok)return NaN;const r=toRPN(tok);if(!r)return NaN;return evalRPN(r)}

// ===== Boot: jisté navázání listenerů =====
(function boot(){
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(attachApp, 0);
  } else {
    document.addEventListener("DOMContentLoaded", attachApp);
  }
})();

function $(id){return document.getElementById(id);}

function attachApp(){
  console.log("attachApp(): binding…");

  const home=$('home'), practice=$('practice'),
        feedback=$('feedback'), vypocet=$('vypocet'),
        zapis=$('zapis'), zapisList=$('zapis-list'),
        zadaniText=$('zadani-text'), formulaDisplay=$('formulaDisplay'),
        sceneDisplay=$('sceneDisplay');

  // ——— Výběry (modul/obtížnost) ———
  document.querySelectorAll('#moduleGroup .btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#moduleGroup .btn').forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected'); window._module=btn.dataset.value;
    });
  });
  document.querySelectorAll('#difficultyGroup .btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#difficultyGroup .btn').forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected'); window._difficulty=btn.dataset.value;
    });
  });

  // ——— Start ———
  $('startBtn').addEventListener('click',()=>{
    const topic=$('topic').value;
    if(!topic || !window._module || !window._difficulty){
      alert('Vyber téma, modul i obtížnost.');
      return;
    }
    home.classList.add('hidden');
    practice.classList.remove('hidden');
    renderFormula(topic, window._difficulty);
    resetZapis(); // s default "-" položkami
  });

  // ——— Zápis / Výpočet ———
  $('checkZapisBtn').addEventListener('click',()=>{
    // jednoduchá validace: žádná položka nesmí zůstat "-"
    const bad = Array.from(zapisList.children).some(row=>{
      const selects=row.querySelectorAll('select');
      const val=row.querySelector('input')?.value.trim();
      return (selects[0].value==='-' || selects[1].value==='-' || val==='' || val==='?');
    });
    if(bad){
      feedback.textContent='Doplň všechny řádky v zápisu (vyber veličinu, jednotku a hodnotu).';
      feedback.classList.remove('hidden');
      return;
    }
    feedback.textContent='Zkontroluj jednotky – musí být v základních jednotkách (N, m, J).';
    feedback.classList.remove('hidden');
    vypocet.classList.remove('hidden');
    zapis.classList.add('hidden');
  });

  $('checkVypocetBtn').addEventListener('click',()=>{
    feedback.textContent='Správně! (Ukázkové hodnocení – validace kroků se doplní v další iteraci.)';
    feedback.classList.remove('hidden');
  });

  // ——— Extra tlačítka (v příkladech) ———
  $('formulaBtn').addEventListener('click',()=>{ formulaDisplay.classList.toggle('hidden'); });
  $('sceneBtn').addEventListener('click',()=>{
    const params = extractParamsFromZadani(zadaniText.textContent);
    sceneDisplay.innerHTML = renderSceneSVG(params);
    sceneDisplay.classList.toggle('hidden');
  });
  $('helpBtn').addEventListener('click',()=>{
    const params = extractParamsFromZadani(zadaniText.textContent);
    const emptyRow = Array.from(zapisList.children).find(r => r.querySelector('input').value.trim()==='');
    if(emptyRow){
      const velSel=emptyRow.querySelector('select');           // veličina
      const uniSel=emptyRow.querySelectorAll('select')[1];     // jednotka
      const valInp=emptyRow.querySelector('input');
      const vel=velSel.value;

      let val=''; let unit='-';
      if(vel==='F' && params.F!=null){ val=params.F; unit='N'; }
      else if(vel==='s' && params.s!=null){ val=params.s; unit='m'; }
      else if(vel==='W' && params.W!=null){ val=params.W; unit='J'; }
      // hustota (pokud někdy v zadání bude)
      else if(vel==='m' && params.m!=null){ val=params.m; unit='kg'; }
      else if(vel==='V' && params.V!=null){ val=params.V; unit='m³'; }
      else if(vel==='ρ' && params.rho!=null){ val=params.rho; unit='g/cm³'; }

      if(val!==''){
        valInp.value=String(val);
        if(unit!=='-') uniSel.value=unit;
        feedback.textContent=`Nápověda: doplněna veličina ${vel} = ${val} ${unit!=='-'?unit:''} podle zadání.`;
      }else{
        feedback.textContent='Nápověda: pro zvolenou veličinu nemám hodnotu v zadání.';
      }
      feedback.classList.remove('hidden');
    }else{
      feedback.textContent='Všechny řádky už jsou vyplněné.';
      feedback.classList.remove('hidden');
    }
  });

  // ——— Nový příklad / Zpět ———
  const zadaniList=[
    'Jakou práci vykoná síla 1500 N působící na dráze 50 m?',
    'Jak velkou práci vykoná síla 200 N při posunutí tělesa o 30 m?',
    'Síla 500 N působí na těleso po dráze 20 m. Jakou práci vykoná?',
    'Jakou dráhu urazí těleso, když práce je 6000 J a síla 300 N?',
    'Jak velká síla vykoná práci 9000 J při posunutí o 15 m?'
  ];
  $('newTaskBtn').addEventListener('click',()=>{
    zadaniText.textContent = zadaniList[Math.floor(Math.random()*zadaniList.length)];
    feedback.classList.add('hidden');
    vypocet.classList.add('hidden');
    zapis.classList.remove('hidden');
    sceneDisplay.classList.add('hidden');
    sceneDisplay.innerHTML='';
    resetZapis();
  });
  $('backBtn').addEventListener('click',()=>{
    practice.classList.add('hidden');
    home.classList.remove('hidden');
  });

  // ——— Vzorec: dynamické SVG + opravená příčka uvnitř ———
  function renderFormula(topic, difficulty){
    let svg = "";
    if(topic === "Práce"){
      svg = `
        <svg viewBox="0 0 240 160" aria-label="Vzorec W=F·s">
          <polygon points="120,16 28,136 212,136" fill="none" stroke="#60a5fa" stroke-width="2"/>
          <!-- vodorovná příčka UVNITŘ: držím ji 8 px od okrajů -->
          <line x1="48" y1="92" x2="192" y2="92" stroke="#60a5fa" stroke-width="2"/>
          <text x="112" y="48" fill="#60a5fa" font-size="22">W</text>
          <text x="98" y="124" fill="#60a5fa" font-size="18">F · s</text>
        </svg>`;
    } else if(topic === "Hustota"){
      svg = `
        <svg viewBox="0 0 240 160" aria-label="Vzorec ρ=m/V">
          <polygon points="120,16 28,136 212,136" fill="none" stroke="#facc15" stroke-width="2"/>
          <line x1="48" y1="92" x2="192" y2="92" stroke="#facc15" stroke-width="2"/>
          <text x="114" y="48" fill="#facc15" font-size="22">ρ</text>
          <text x="100" y="124" fill="#facc15" font-size="18">m · V</text>
        </svg>`;
    }
    if(difficulty==="Normální" || difficulty==="Výzva"){
      svg += `<div style="margin-top:10px;font-size:16px;">Další veličiny: m (hmotnost), V (objem), ρ (hustota)</div>`;
    }
    formulaDisplay.innerHTML = svg;
  }

  // ——— Pomocné: extrakce parametrů ze zadání ———
  function extractParamsFromZadani(text){
    let m1 = text.match(/síla\s+(\d+)\s*N.*dráze\s+(\d+)\s*m/i);
    if(m1){ return {F:+m1[1], s:+m1[2], W:null}; }
    let m2 = text.match(/síla\s+(\d+)\s*N.*posunutí.*?o\s+(\d+)\s*m/i);
    if(m2){ return {F:+m2[1], s:+m2[2], W:null}; }
    let m3 = text.match(/Síla\s+(\d+)\s*N.*dráze\s+(\d+)\s*m/i);
    if(m3){ return {F:+m3[1], s:+m3[2], W:null}; }
    let m4 = text.match(/práce\s+je\s+(\d+)\s*J.*síla\s+(\d+)\s*N/i);
    if(m4){ return {W:+m4[1], F:+m4[2], s:null}; }
    let m5 = text.match(/práce\s+(\d+)\s*J.*posunutí.*?o\s+(\d+)\s*m/i);
    if(m5){ return {W:+m5[1], s:+m5[2], F:null}; }
    return {F:null,s:null,W:null};
  }

  // ——— Scéna SVG ———
  function renderSceneSVG(p){
    const Ftxt = (p.F!=null)? `F = ${p.F} N` : 'F = ?';
    const stxt = (p.s!=null)? `s = ${p.s} m` : 's = ?';
    const Wtxt = (p.W!=null)? `W = ${p.W} J` : 'W = ?';

    return `
      <svg viewBox="0 0 520 220" aria-label="Schéma situace práce na vodorovné podložce">
        <line x1="20" y1="180" x2="500" y2="180" stroke="#64748b" stroke-width="3"/>
        <rect x="220" y="130" width="80" height="50" rx="6" fill="#334155" stroke="#94a3b8" />
        <line x1="300" y1="155" x2="440" y2="155" stroke="#60a5fa" stroke-width="4" marker-end="url(#arrow)"/>
        <text x="360" y="140" fill="#60a5fa" font-size="14" text-anchor="middle">${Ftxt}</text>
        <line x1="220" y1="200" x2="440" y2="200" stroke="#a3e635" stroke-width="3" marker-end="url(#arrowg)"/>
        <text x="330" y="218" fill="#a3e635" font-size="14" text-anchor="middle">${stxt}</text>
        <text x="60" y="40" fill="#fca5a5" font-size="16">${Wtxt}</text>
        <defs>
          <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
            <polygon points="0,0 12,6 0,12" fill="#60a5fa"/>
          </marker>
          <marker id="arrowg" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
            <polygon points="0,0 12,6 0,12" fill="#a3e635"/>
          </marker>
        </defs>
      </svg>
    `;
  }

  // ——— Zápis: výchozí „-“ u VELIČIN i JEDNOTEK ———
  function selectEl(opts, def){
    const s=document.createElement('select');
    // vždy první volba „-“ jako placeholder
    const dash=document.createElement('option'); dash.textContent='-'; s.appendChild(dash);
    opts.forEach(o=>{const op=document.createElement('option');op.textContent=o;if(o===def)op.selected=true;s.appendChild(op);});
    // pokud def není, ponecháme „-“ jako default
    return s;
  }

  function makeRow(vel='-', val='', unit='-'){
    const r=document.createElement('div'); r.className='zapis-radek';
    const sVel=selectEl(['s','F','W','m','V','ρ'],vel);
    const inp=document.createElement('input'); inp.placeholder='Hodnota'; inp.value=val;
    const sUni=selectEl(['m','cm','km','N','kN','J','kJ','kg','m³','g/cm³'],unit);
    const cb=document.createElement('input'); cb.type='checkbox'; cb.className='checkbox'; cb.title='Hledaná veličina';
    cb.addEventListener('change',()=>{
      if(cb.checked){
        zapisList.querySelectorAll('input[type=checkbox]').forEach(x=>{if(x!==cb)x.checked=false;});
        inp.value='?';
      }else if(inp.value==='?'){inp.value='';}
    });
    r.append(sVel,inp,sUni,cb);
    return r;
  }

  function resetZapis(){
    zapisList.innerHTML='';
    // tři řádky, ale se startovní „-“ všude
    zapisList.append(makeRow('-', '', '-'), makeRow('-', '', '-'), makeRow('-', '', '-'));
  }

  // Přidat řádek
  $('addRowBtn').addEventListener('click',()=>zapisList.append(makeRow('-', '', '-')));

  // ===== Kalkulačka =====
  const calcModal=$('calcModal'), calcDisplay=$('calcDisplay'),
        calcLast=$('calcLast'), calcButtons=$('calcButtons'),
        copyBtn=$('copyResultBtn'), copiedMsg=$('copiedMsg');
  let expr='', last='';

  const layout = [
    {t:'7'},{t:'8'},{t:'9'},{t:'/',c:'op'},
    {t:'4'},{t:'5'},{t:'6'},{t:'*',c:'op'},
    {t:'1'},{t:'2'},{t:'3'},{t:'-',c:'op'},
    {t:'0'},{t:'.'},{t:'=',c:'eq'},{t:'+',c:'op'},
    {t:'←',c:'spec'},{t:'C',c:'spec'}
  ];
  calcButtons.innerHTML='';
  layout.forEach(({t,c})=>{
    const b=document.createElement('button');
    b.className='calc-btn'+(c?(' '+c):'');
    b.textContent=t;
    calcButtons.appendChild(b);
  });
  $('calcBtn').addEventListener('click',()=>calcModal.classList.remove('hidden'));
  $('closeCalc').addEventListener('click',()=>calcModal.classList.add('hidden'));
  calcModal.addEventListener('click',e=>{ if(e.target===calcModal) calcModal.classList.add('hidden'); });
  calcButtons.addEventListener('click',e=>{
    if(!e.target.classList.contains('calc-btn'))return;
    press(e.target.textContent);
  });
  document.addEventListener('keydown',e=>{
    if(calcModal.classList.contains('hidden'))return;
    if(/[0-9+\-*/.()]/.test(e.key)){ expr+=e.key; calcDisplay.textContent=expr; }
    else if(e.key==='Enter'){ compute(); }
    else if(e.key==='Backspace'){ expr=expr.slice(0,-1); calcDisplay.textContent=expr; }
    else if(e.key==='Escape'){ calcModal.classList.add('hidden'); }
  });
  function press(v){
    if(v==='C'){ expr=''; calcDisplay.textContent=''; return; }
    if(v==='←'){ expr=expr.slice(0,-1); calcDisplay.textContent=expr; return; }
    if(v==='='){ compute(); return; }
    expr += v; calcDisplay.textContent = expr;
  }
  function compute(){
    const res = safeCalc(expr);
    if(isNaN(res)){ calcDisplay.textContent='Chyba'; expr=''; return; }
    last = expr + ' = ' + res;
    expr = String(res);
    calcLast.textContent = last;
    calcDisplay.textContent = expr;
  }
  copyBtn.addEventListener('click', async ()=>{
    const text = calcDisplay.textContent || '';
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
      }else{
        const ta=document.createElement('textarea');
        ta.value=text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      copiedMsg.classList.remove('hidden');
    }catch{}
  });
}
