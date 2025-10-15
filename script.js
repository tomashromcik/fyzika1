console.log("script v9: start");

// ——— kalkulačka bez eval (beze změn jádra) ———
function tokenize(e){const t=[];let i=0;while(i<e.length){const c=e[i];if(/\s/.test(c)){i++;continue}if(/[0-9.]/.test(c)){let n=c;i++;while(i<e.length&&/[0-9.]/.test(e[i])){n+=e[i++]}t.push({type:"num",value:n});continue}if(/[+\-*/()]/.test(c)){t.push({type:"op",value:c});i++;continue}return null}return t}
function normalizeUnary(e){let o=e.replace(/\s+/g,"");o=o.replace(/^\-/,"0-");o=o.replace(/\(\-/g,"(0-");return o}
function toRPN(tok){const out=[],st=[];const prec={"+":1,"-":1,"*":2,"/":2};for(const x of tok){if(x.type==="num"){out.push(x)}else if(/[+\-*/]/.test(x.value)){while(st.length){const top=st[st.length-1];if(/[+\-*/]/.test(top.value)&&prec[x.value]<=prec[top.value]){out.push(st.pop())}else break}st.push(x)}else if(x.value==="("){st.push(x)}else if(x.value===")"){let f=false;while(st.length){const top=st.pop();if(top.value==="("){f=true;break}out.push(top)}if(!f)return null}}while(st.length){const top=st.pop();if(top.value==="("||top.value===")")return null;out.push(top)}return out}
function evalRPN(r){const s=[];for(const t of r){if(t.type==="num"){s.push(parseFloat(t.value))}else{const b=s.pop(),a=s.pop();if(a===undefined||b===undefined)return NaN;if(t.value==="+")s.push(a+b);else if(t.value==="−"||t.value==="-" )s.push(a-b);else if(t.value==="*")s.push(a*b);else if(t.value==="/")s.push(b===0?NaN:a/b)}}return s.length===1?s[0]:NaN}
function safeCalc(expr){const n=normalizeUnary(expr);const tok=tokenize(n);if(!tok)return NaN;const r=toRPN(tok);if(!r)return NaN;return evalRPN(r)}

// ——— app ———
document.addEventListener("DOMContentLoaded", attachApp);
function $(id){return document.getElementById(id);}

function attachApp(){
  const home=$('home'), practice=$('practice'),
        feedback=$('feedback'), zapisList=$('zapis-list'),
        zadaniText=$('zadani-text'), formulaDisplay=$('formulaDisplay'),
        sceneDisplay=$('sceneDisplay');

  // výběry
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

  $('startBtn').addEventListener('click',()=>{
    if(!window._module||!window._difficulty){ alert('Vyber modul i obtížnost.'); return; }
    home.classList.add('hidden'); practice.classList.remove('hidden');
    resetZapis(); // dynamické roletky podle obtížnosti
  });

  // —— dynamika výběrů ——
  function getVarOptions(){
    // pouze Práce; pro Výzvu povolíme i m,V,ρ ve výběru (řádky se nepřidávají automaticky)
    return (window._difficulty==='Výzva') ? ['W','F','s','m','V','ρ'] : ['W','F','s'];
  }
  const unitMap = {
    'W': ['J','kJ'],
    'F': ['N','kN'],
    's': ['m','cm','km'],
    'm': ['kg'],
    'V': ['m³'],
    'ρ': ['kg/m³','g/cm³']
  };
  function getUnitsForVar(v){
    return unitMap[v] || [];
  }

  function selectWithDash(options, def){
    const s=document.createElement('select');
    const dash=document.createElement('option'); dash.textContent='-'; dash.value='-'; s.appendChild(dash);
    options.forEach(o=>{const op=document.createElement('option'); op.textContent=o; op.value=o; s.appendChild(op);});
    s.value = def || '-';
    return s;
  }

  function makeRow(){
    const r=document.createElement('div'); r.className='zapis-radek';
    const sVel = selectWithDash(getVarOptions(), '-');
    const eq1 = document.createElement('span'); eq1.textContent='=';
    const inp = document.createElement('input'); inp.placeholder='Hodnota';
    const eq2 = document.createElement('span'); eq2.textContent='=';
    const sUni = selectWithDash([], '-');
    const cb = document.createElement('input'); cb.type='checkbox'; cb.className='checkbox'; cb.title='Hledaná veličina';

    // při změně veličiny aktualizuj jednotky
    sVel.addEventListener('change', ()=>{
      const u = getUnitsForVar(sVel.value);
      // přestavět roletku jednotek
      sUni.innerHTML='';
      const dash=document.createElement('option'); dash.textContent='-'; dash.value='-'; sUni.appendChild(dash);
      u.forEach(x=>{const op=document.createElement('option'); op.textContent=x; op.value=x; sUni.appendChild(op);});
      sUni.value='-';
    });

    cb.addEventListener('change', ()=>{
      if(cb.checked){ inp.value='?'; }
      else if(inp.value==='?'){ inp.value=''; }
    });

    r.append(sVel, eq1, inp, eq2, sUni, cb);
    return r;
  }

  function resetZapis(){
    zapisList.innerHTML='';
    // vždy tři prázdné řádky; žák si sám zvolí veličiny i jednotky (výběr je dynamický)
    zapisList.append(makeRow(), makeRow(), makeRow());
  }

  $('addRowBtn').addEventListener('click',()=>zapisList.append(makeRow()));

  $('checkZapisBtn').addEventListener('click',()=>{
    // základní kontrola vyplnění (žádná položka '-')
    const bad = Array.from(zapisList.children).some(row=>{
      const selects=row.querySelectorAll('select');
      const val=row.querySelector('input')?.value.trim();
      return (selects[0].value==='-' || selects[1].value==='-' || val==='' || val==='?');
    });
    if(bad){
      feedback.textContent='Doplň všechny řádky v zápisu (vyber veličinu, zadej hodnotu, vyber jednotku).';
      feedback.classList.remove('hidden');
      return;
    }
    feedback.textContent='Zápis vypadá v pořádku. Pokračuj výpočtem.';
    feedback.classList.remove('hidden');
  });

  // —— VZORCE —— (W=F·s vždy; u Výzva navíc ρ=m/V; příčka je uvnitř)
  $('formulaBtn').addEventListener('click', ()=>{
    formulaDisplay.innerHTML = renderFormulas(window._difficulty);
    formulaDisplay.classList.toggle('hidden');
  });

  function renderFormulas(diff){
    const triWork = `
      <div class="formula-box">
        <svg viewBox="0 0 240 160" aria-label="W=F·s">
          <polygon points="120,16 28,136 212,136" fill="none" stroke="#60a5fa" stroke-width="2"/>
          <!-- vodorovná příčka bezpečně uvnitř: kratší, aby se nedotýkala odvěsen -->
          <line x1="80" y1="90" x2="160" y2="90" stroke="#60a5fa" stroke-width="2"/>
          <text x="112" y="48" fill="#60a5fa" font-size="22">W</text>
          <text x="100" y="124" fill="#60a5fa" font-size="18">F · s</text>
        </svg>
        <div>W = F · s</div>
      </div>`;
    if(diff==='Výzva'){
      const triRho = `
      <div class="formula-box">
        <svg viewBox="0 0 240 160" aria-label="ρ=m/V">
          <polygon points="120,16 28,136 212,136" fill="none" stroke="#facc15" stroke-width="2"/>
          <line x1="80" y1="90" x2="160" y2="90" stroke="#facc15" stroke-width="2"/>
          <text x="112" y="48" fill="#facc15" font-size="22">ρ</text>
          <text x="100" y="124" fill="#facc15" font-size="18">m / V</text>
        </svg>
        <div>ρ = m / V</div>
      </div>`;
      return triWork + triRho;
    }
    return triWork;
  }

  // —— Obrázek (zatím placeholder; tlačítko funguje) ——
  $('sceneBtn').addEventListener('click', ()=>{
    sceneDisplay.innerHTML = `
      <svg viewBox="0 0 520 220" aria-label="Schéma">
        <line x1="20" y1="180" x2="500" y2="180" stroke="#64748b" stroke-width="3"/>
        <rect x="220" y="130" width="80" height="50" rx="6" fill="#334155" stroke="#94a3b8" />
        <line x1="300" y1="155" x2="440" y2="155" stroke="#60a5fa" stroke-width="4" marker-end="url(#a)"/>
        <line x1="220" y1="200" x2="440" y2="200" stroke="#a3e635" stroke-width="3" marker-end="url(#b)"/>
        <defs>
          <marker id="a" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
            <polygon points="0,0 12,6 0,12" fill="#60a5fa"/>
          </marker>
          <marker id="b" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
            <polygon points="0,0 12,6 0,12" fill="#a3e635"/>
          </marker>
        </defs>
      </svg>`;
    sceneDisplay.classList.toggle('hidden');
  });

  // —— Nápověda – doplní první prázdný řádek podle zadání, pokud lze ——
  $('helpBtn').addEventListener('click', ()=>{
    const params = extractParamsFromZadani(zadaniText.textContent);
    const row = Array.from(zapisList.children).find(r => r.querySelector('input').value.trim()==='');
    if(!row){ feedback.textContent='Všechny řádky už jsou vyplněné.'; feedback.classList.remove('hidden'); return; }

    const sVel=row.querySelector('select');
    const inp=row.querySelector('input');
    const sUni=row.querySelectorAll('select')[1];

    // pokud už je zvolená veličina, pokus se ji doplnit; jinak zkus pořadí W,F,s
    let target = sVel.value !== '-' ? sVel.value : (params.W!=null?'W':params.F!=null?'F':params.s!=null?'s':null);
    if(!target){ feedback.textContent='Nápověda: v zadání není přímá hodnota pro tento řádek.'; feedback.classList.remove('hidden'); return; }

    sVel.value = target;
    sVel.dispatchEvent(new Event('change')); // obnov jednotky

    let val=null, unit='-';
    if(target==='W' && params.W!=null){ val=params.W; unit='J'; }
    if(target==='F' && params.F!=null){ val=params.F; unit='N'; }
    if(target==='s' && params.s!=null){ val=params.s; unit='m'; }

    if(val!=null){
      inp.value=String(val);
      sUni.value=unit;
      feedback.textContent=`Nápověda: doplněno ${target} = ${val} ${unit}.`;
    }else{
      feedback.textContent='Nápověda: tuto veličinu nelze ze zadání přímo doplnit.';
    }
    feedback.classList.remove('hidden');
  });

  // —— Kalkulačka (jen aby tlačítko reagovalo; plné UI můžeš vrátit později) ——
  $('calcBtn').addEventListener('click', ()=> alert('Kalkulačka – připraveno. (UI zminifikováno kvůli ladění funkčnosti tlačítek.)') );

  // —— Parsování jednoduchých zadání (W=F*s) ——
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
}
