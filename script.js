console.log("script.js v6: načteno");

// Bezpečné spuštění
document.addEventListener("DOMContentLoaded", attachApp);

function $(id){return document.getElementById(id);}

function attachApp(){
  const home=$('home'), practice=$('practice'),
        feedback=$('feedback'), zapisList=$('zapis-list'),
        formulaDisplay=$('formulaDisplay');

  // Výběry
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
    if(!window._module||!window._difficulty){ alert("Vyber modul i obtížnost."); return; }
    home.classList.add('hidden');
    practice.classList.remove('hidden');
    resetZapis();
  });

  // --- zápis ---
  function selectEl(opts, def){
    const s=document.createElement('select');
    const dash=document.createElement('option'); dash.textContent='-'; s.appendChild(dash);
    opts.forEach(o=>{const op=document.createElement('option');op.textContent=o;if(o===def)op.selected=true;s.appendChild(op);});
    return s;
  }

  function makeRow(vel='-', val='', unit='-'){
    const r=document.createElement('div'); r.className='zapis-radek';
    const sVel=selectEl(['W','F','s','m','V','ρ'],vel);
    const velEq=document.createElement('span'); velEq.textContent='=';
    const inp=document.createElement('input'); inp.placeholder='Hodnota'; inp.value=val;
    const valEq=document.createElement('span'); valEq.textContent='=';
    const sUni=selectEl(['m','cm','km','N','kN','J','kJ','kg','m³','g/cm³'],unit);
    const cb=document.createElement('input'); cb.type='checkbox'; cb.title='Hledaná veličina'; cb.className='checkbox';
    cb.addEventListener('change',()=>{ if(cb.checked){ inp.value='?'; } else if(inp.value==='?'){inp.value='';} });
    r.append(sVel, velEq, inp, valEq, sUni, cb);
    return r;
  }

  function resetZapis(){
    zapisList.innerHTML='';
    zapisList.append(makeRow(), makeRow(), makeRow());
  }

  $('addRowBtn').addEventListener('click',()=>zapisList.append(makeRow()));

  $('checkZapisBtn').addEventListener('click',()=>{
    feedback.textContent='Zkontroluj, zda jsi uvedl všechny veličiny i jednotky.';
    feedback.classList.remove('hidden');
  });

  // --- vzorce ---
  $('formulaBtn').addEventListener('click',()=>{
    formulaDisplay.innerHTML = renderFormulas(window._difficulty);
    formulaDisplay.classList.toggle('hidden');
  });

  function renderFormulas(diff){
    const baseTri = `
      <div class="formula-box">
        <svg viewBox="0 0 240 160">
          <polygon points="120,16 28,136 212,136" fill="none" stroke="#60a5fa" stroke-width="2"/>
          <line x1="48" y1="92" x2="192" y2="92" stroke="#60a5fa" stroke-width="2"/>
          <text x="112" y="48" fill="#60a5fa" font-size="22">W</text>
          <text x="98" y="124" fill="#60a5fa" font-size="18">F · s</text>
        </svg>
        <div>W = F · s</div>
      </div>`;
    if(diff === "Výzva"){
      const rhoTri = `
        <div class="formula-box">
          <svg viewBox="0 0 240 160">
            <polygon points="120,16 28,136 212,136" fill="none" stroke="#facc15" stroke-width="2"/>
            <line x1="48" y1="92" x2="192" y2="92" stroke="#facc15" stroke-width="2"/>
            <text x="112" y="48" fill="#facc15" font-size="22">ρ</text>
            <text x="100" y="124" fill="#facc15" font-size="18">m / V</text>
          </svg>
          <div>ρ = m / V</div>
        </div>`;
      return baseTri + rhoTri;
    } else return baseTri;
  }
}
