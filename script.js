console.log("script.js: načteno a spuštěno");

// =============== Pomocné funkce + parser kalkulačky (bez eval) ===============
function $(id){return document.getElementById(id);}

// Kalkulačka bez eval()
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
  const home=$('home'), practice=$('practice'),
        feedback=$('feedback'), vypocet=$('vypocet'),
        zapis=$('zapis'), zapisList=$('zapis-list'),
        zadaniText=$('zadani-text'), formulaDisplay=$('formulaDisplay');

  // Výběry
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
    renderFormula(topic, window._difficulty);
    resetZapis();
  });

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

  $('formulaBtn').addEventListener('click',()=>{
    formulaDisplay.classList.toggle('hidden');
  });

  // ============= Dynamický vzorec =============
  function renderFormula(topic, difficulty){
    let svg = "";
    if(topic === "Práce"){
      svg = `
        <svg viewBox="0 0 220 140">
          <polygon points="110,10 20,120 200,120" fill="none" stroke="#60a5fa" stroke-width="2"/>
          <!-- posunutá vodorovná čára uvnitř trojúhelníku -->
          <line x1="50" y1="80" x2="170" y2="80" stroke="#60a5fa" stroke-width="2"/>
          <text x="103" y="45" fill="#60a5fa" font-size="20">W</text>
          <text x="85" y="110" fill="#60a5fa" font-size="18">F · s</text>
        </svg>`;
    } else if(topic === "Hustota"){
      svg = `
        <svg viewBox="0 0 220 140">
          <polygon points="110,10 20,120 200,120" fill="none" stroke="#facc15" stroke-width="2"/>
          <line x1="50" y1="80" x2="170" y2="80" stroke="#facc15" stroke-width="2"/>
          <text x="103" y="45" fill="#facc15" font-size="20">ρ</text>
          <text x="90" y="110" fill="#facc15" font-size="18">m · V</text>
        </svg>`;
    }

    if(difficulty === "Normální" || difficulty === "Výzva"){
      svg += `<div style="margin-top:10px;font-size:16px;">
        Další veličiny: m (hmotnost), V (objem), ρ (hustota)
      </div>`;
    }

    formulaDisplay.innerHTML = svg;
  }

  // ============= Kalkulačka =============
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

  // ============= Zápis =============
  function selectEl(opts, def){
    const s=document.createElement('select');
    opts.forEach(o=>{const op=document.createElement('option');op.textContent=o;if(o===def)op.selected=true;s.appendChild(op);});
    return s;
  }
  function makeRow(vel='s', val='', unit='m'){
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
    zapisList.append(makeRow('F','', 'N'), makeRow('s','', 'm'), makeRow('W','', 'J'));
  }
  $('addRowBtn').addEventListener('click',()=>zapisList.append(makeRow()));
});
