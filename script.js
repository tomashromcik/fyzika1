// =============== Pomocné funkce + parser kalkulačky (bez eval) ===============
function $(id){return document.getElementById(id);}

// Tokenizace
function tokenize(expr){
  const tokens=[]; let i=0;
  while(i<expr.length){
    const ch=expr[i];
    if(/\s/.test(ch)){ i++; continue; }
    if(/[0-9.]/.test(ch)){
      let num=ch; i++;
      while(i<expr.length && /[0-9.]/.test(expr[i])){ num+=expr[i++]; }
      tokens.push({type:'num', value:num});
      continue;
    }
    if(/[+\-*/()]/.test(ch)){ tokens.push({type:'op', value:ch}); i++; continue; }
    return null;
  }
  return tokens;
}
function normalizeUnary(expr){
  let out=expr.replace(/\s+/g,'');
  out = out.replace(/^\-/,'0-');
  out = out.replace(/\(\-/g,'(0-');
  return out;
}
function toRPN(tokens){
  const out=[]; const stack=[];
  const prec={'+':1,'-':1,'*':2,'/':2};
  for(const t of tokens){
    if(t.type==='num'){ out.push(t); }
    else if(/[+\-*/]/.test(t.value)){
      while(stack.length){
        const top=stack[stack.length-1];
        if(/[+\-*/]/.test(top.value) && prec[t.value] <= prec[top.value]){
          out.push(stack.pop());
        }else break;
      }
      stack.push(t);
    }else if(t.value==='('){ stack.push(t); }
    else if(t.value===')'){
      let found=false;
      while(stack.length){
        const top=stack.pop();
        if(top.value==='('){ found=true; break; }
        out.push(top);
      }
      if(!found) return null;
    }
  }
  while(stack.length){
    const t=stack.pop();
    if(t.value==='('||t.value===')') return null;
    out.push(t);
  }
  return out;
}
function evalRPN(rpn){
  const st=[];
  for(const t of rpn){
    if(t.type==='num'){ st.push(parseFloat(t.value)); }
    else{
      const b=st.pop(), a=st.pop();
      if(a===undefined||b===undefined) return NaN;
      if(t.value==='+') st.push(a+b);
      else if(t.value==='-') st.push(a-b);
      else if(t.value==='*') st.push(a*b);
      else if(t.value==='/') st.push(b===0?NaN:a/b);
    }
  }
  return st.length===1? st[0] : NaN;
}
function safeCalc(expr){
  const norm=normalizeUnary(expr);
  const tok=tokenize(norm); if(!tok) return NaN;
  const rpn=toRPN(tok); if(!rpn) return NaN;
  return evalRPN(rpn);
}

// ================================ Aplikace ===================================
document.addEventListener('DOMContentLoaded',()=>{
  // DOM
  const home=$('home'), practice=$('practice'), feedback=$('feedback'),
        vypocet=$('vypocet'), zapis=$('zapis'), zapisList=$('zapis-list'),
        zadaniText=$('zadani-text'), sceneDisplay=$('sceneDisplay');

  // ÚVOD – výběry
  document.querySelectorAll('#moduleGroup .btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#moduleGroup .btn').forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected');
      window._module=btn.dataset.value;
    });
  });
  document.querySelectorAll('#difficultyGroup .btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('#difficultyGroup .btn').forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected');
      window._difficulty=btn.dataset.value;
    });
  });

  $('startBtn').addEventListener('click',()=>{
    const topic=$('topic').value;
    if(!topic||!window._module||!window._difficulty){
      alert('Vyber téma, modul i obtížnost.');
      return;
    }
    home.classList.add('hidden');
    practice.classList.remove('hidden');
    resetZapis();
  });

  $('backBtn').addEventListener('click',()=>{
    practice.classList.add('hidden');
    home.classList.remove('hidden');
  });

  // ===== Zadání a generování =====
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

  // ===== Vzorec a Obrázek =====
  $('formulaBtn').addEventListener('click',()=>{
    $('formulaDisplay').classList.toggle('hidden');
  });

  $('sceneBtn').addEventListener('click',()=>{
    const params = extractParamsFromZadani(zadaniText.textContent);
    sceneDisplay.innerHTML = renderSceneSVG(params);
    sceneDisplay.classList.toggle('hidden');
  });

  // ===== Nápověda – doplňuje hodnoty ZE ZADÁNÍ =====
  $('helpBtn').addEventListener('click',()=>{
    const params = extractParamsFromZadani(zadaniText.textContent);
    // najdi první prázdný řádek a doplň podle zvolené veličiny
    const emptyRow = Array.from(zapisList.children)
      .find(row => row.querySelector('input').value.trim()==='');
    if(emptyRow){
      const velSel = emptyRow.querySelector('select');             // první select (s/F/W)
      const unitSel = emptyRow.querySelectorAll('select')[1];      // druhý select (jednotka)
      const valInp = emptyRow.querySelector('input');

      const vel = velSel.value; // 's' | 'F' | 'W'
      let val = '';
      if(vel==='F' && params.F!=null){ val = params.F; unitSel.value='N'; }
      else if(vel==='s' && params.s!=null){ val = params.s; unitSel.value='m'; }
      else if(vel==='W' && params.W!=null){ val = params.W; unitSel.value='J'; }

      if(val!==''){
        valInp.value = String(val);
        feedback.textContent = `Nápověda: doplněna veličina ${vel} = ${val} (${unitSel.value}) podle zadání.`;
      }else{
        feedback.textContent = 'Nápověda: pro zvolenou veličinu nemám hodnotu v zadání.';
      }
      feedback.classList.remove('hidden');
    }else{
      feedback.textContent='Všechny řádky už jsou vyplněné.';
      feedback.classList.remove('hidden');
    }
  });

  // ===== Zápis – řádky =====
  function selectEl(opts, def){
    const s=document.createElement('select');
    opts.forEach(o=>{const op=document.createElement('option');op.textContent=o;if(o===def)op.selected=true;s.appendChild(op);});
    return s;
  }
  function makeRow(vel='s', val='', unit='m'){
    const r=document.createElement('div'); r.className='zapis-radek';
    const sVel=selectEl(['s','F','W'],vel);
    const inp=document.createElement('input'); inp.placeholder='Hodnota'; inp.value=val;
    const sUni=selectEl(['m','cm','km','N','kN','J','kJ'],unit);
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
    zapisList.append(makeRow('F','', 'N'), makeRow('s','', 'm'), makeRow('W','', 'J'));
  }
  $('addRowBtn').addEventListener('click',()=>zapisList.append(makeRow()));
  $('checkZapisBtn').addEventListener('click',()=>{
    feedback.textContent='Zkontroluj jednotky – musí být v základních jednotkách (N, m, J).';
    feedback.classList.remove('hidden');
    vypocet.classList.remove('hidden');
    zapis.classList.add('hidden');
  });
  $('checkVypocetBtn').addEventListener('click',()=>{
    feedback.textContent='Správně! Práce je 75 000 J. Skvělá práce!';
    feedback.classList.remove('hidden');
  });

  // ===== Kalkulačka (UI + interakce) =====
  const calcModal=$('calcModal'), calcDisplay=$('calcDisplay'), calcLast=$('calcLast'),
        calcButtons=$('calcButtons'), copyBtn=$('copyResultBtn'), copiedMsg=$('copiedMsg');
  let expr='', last='';

  // vytvoření tlačítek s rozlišením kategorií
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

  function openCalc(){ calcModal.classList.remove('hidden'); copiedMsg.classList.add('hidden'); }
  function closeCalc(){ calcModal.classList.add('hidden'); }
  $('calcBtn').addEventListener('click',openCalc);
  $('closeCalc').addEventListener('click',closeCalc);
  calcModal.addEventListener('click',e=>{ if(e.target===calcModal) closeCalc(); });

  calcButtons.addEventListener('click',e=>{
    if(!e.target.classList.contains('calc-btn'))return;
    press(e.target.textContent);
  });
  document.addEventListener('keydown',e=>{
    if(calcModal.classList.contains('hidden'))return;
    if(/[0-9+\-*/.()]/.test(e.key)){ expr+=e.key; calcDisplay.textContent=expr; }
    else if(e.key==='Enter'){ compute(); }
    else if(e.key==='Backspace'){ expr=expr.slice(0,-1); calcDisplay.textContent=expr; }
    else if(e.key==='Escape'){ closeCalc(); }
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

  // ====== Pomocné: extrakce hodnot ze zadání + vykreslení scény ======
  // podporované šablony z pole zadaniList
  function extractParamsFromZadani(text){
    // W = F*s
    // vzory:
    // 1) "Jakou práci vykoná síla 1500 N působící na dráze 50 m?"
    // 2) "Jak velkou práci vykoná síla 200 N při posunutí tělesa o 30 m?"
    let m1 = text.match(/síla\s+(\d+)\s*N.*dráze\s+(\d+)\s*m/i);
    if(m1){ return {F: Number(m1[1]), s: Number(m1[2]), W: null, type:'work'}; }
    let m2 = text.match(/síla\s+(\d+)\s*N.*posunutí.*?o\s+(\d+)\s*m/i);
    if(m2){ return {F: Number(m2[1]), s: Number(m2[2]), W: null, type:'work'}; }

    // 3) "Síla 500 N působí na těleso po dráze 20 m. Jakou práci vykoná?"
    let m3 = text.match(/Síla\s+(\d+)\s*N.*dráze\s+(\d+)\s*m/i);
    if(m3){ return {F: Number(m3[1]), s: Number(m3[2]), W: null, type:'work'}; }

    // 4) "Jakou dráhu ... když práce je 6000 J a síla 300 N?"
    let m4 = text.match(/práce\s+je\s+(\d+)\s*J.*síla\s+(\d+)\s*N/i);
    if(m4){ return {W: Number(m4[1]), F: Number(m4[2]), s: null, type:'work'}; }

    // 5) "Jak velká síla ... práce 9000 J ... posunutí o 15 m?"
    let m5 = text.match(/práce\s+(\d+)\s*J.*posunutí.*?o\s+(\d+)\s*m/i);
    if(m5){ return {W: Number(m5[1]), s: Number(m5[2]), F: null, type:'work'}; }

    return {F:null,s:null,W:null,type:'work'};
  }

  function renderSceneSVG(p){
    // jednoduchá scéna: blok na vodorovné podložce, šipka síly a dráhy
    const Ftxt = (p.F!=null)? `F = ${p.F} N` : 'F = ?';
    const stxt = (p.s!=null)? `s = ${p.s} m` : 's = ?';
    const Wtxt = (p.W!=null)? `W = ${p.W} J` : 'W = ?';

    // Rozvržení tak, aby se texty nepřekrývaly:
    // - blok uprostřed, šipka s doprava, popisky nad šipkami
    return `
      <svg viewBox="0 0 520 220" aria-label="Schéma situace práce na vodorovné podložce">
        <!-- podložka -->
        <line x1="20" y1="180" x2="500" y2="180" stroke="#64748b" stroke-width="3"/>
        <!-- blok -->
        <rect x="220" y="130" width="80" height="50" rx="6" fill="#334155" stroke="#94a3b8" />
        <!-- síla -->
        <line x1="300" y1="155" x2="440" y2="155" stroke="#60a5fa" stroke-width="4" marker-end="url(#arrow)"/>
        <text x="360" y="140" fill="#60a5fa" font-size="14" text-anchor="middle">${Ftxt}</text>
        <!-- dráha -->
        <line x1="220" y1="200" x2="440" y2="200" stroke="#a3e635" stroke-width="3" marker-end="url(#arrowg)"/>
        <text x="330" y="218" fill="#a3e635" font-size="14" text-anchor="middle">${stxt}</text>
        <!-- práce -->
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
});
