/* =====================================================
   Procvičování fyziky – základní funkční logika (verze 1.0)
   ===================================================== */

console.log("✅ script.js načten");

// Pomocná funkce pro výběr prvku
function $(id) { return document.getElementById(id); }

// Inicializace aplikace po načtení DOM
document.addEventListener("DOMContentLoaded", () => {

  const home = $("home");
  const practice = $("practice");
  const startBtn = $("startBtn");
  const moduleGroup = $("moduleGroup");
  const difficultyGroup = $("difficultyGroup");

  let selectedModule = null;
  let selectedDifficulty = null;

  // --- Výběr modulu ---
  moduleGroup.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", () => {
      moduleGroup.querySelectorAll(".btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedModule = btn.dataset.value;
      console.log("Vybrán modul:", selectedModule);
    });
  });

  // --- Výběr obtížnosti ---
  difficultyGroup.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", () => {
      difficultyGroup.querySelectorAll(".btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedDifficulty = btn.dataset.value;
      console.log("Vybraná obtížnost:", selectedDifficulty);
    });
  });

  // --- Spuštění procvičování ---
  startBtn.addEventListener("click", () => {
    if (!selectedModule || !selectedDifficulty) {
      alert("Nejdříve vyber modul i obtížnost!");
      return;
    }

    console.log(`Spouštím: ${selectedModule}, obtížnost: ${selectedDifficulty}`);
    home.classList.add("hidden");
    practice.classList.remove("hidden");

    // Vygeneruj zápis
    generateZapis(selectedDifficulty);
  });

  /* =====================================================
     Funkce: generování zápisu
     ===================================================== */
  function generateZapis(level) {
    const div = document.createElement("div");
    div.id = "zapis-list";
    div.style.marginTop = "20px";

    // vyčistit practice
    const oldList = practice.querySelector("#zapis-list");
    if (oldList) oldList.remove();

    // dynamický výběr veličin podle obtížnosti
    const vars = level === "Výzva" ? ["W", "F", "s", "m", "V", "ρ"] : ["W", "F", "s"];

    // vytvořit 3 prázdné řádky
    for (let i = 0; i < 3; i++) {
      div.appendChild(createZapisRow(vars));
    }

    // přidat tlačítko pro nový řádek
    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Přidat veličinu";
    addBtn.className = "btn";
    addBtn.style.marginTop = "10px";
    addBtn.onclick = () => div.appendChild(createZapisRow(vars));
    div.appendChild(addBtn);

    // vložit do DOM
    practice.appendChild(div);
  }

  /* =====================================================
     Funkce: vytvoření jednoho řádku zápisu
     ===================================================== */
  function createZapisRow(vars) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "auto 1fr auto 1fr 1fr auto";
    row.style.gap = "8px";
    row.style.alignItems = "center";
    row.style.marginBottom = "6px";

    // Veličina
    const sVar = document.createElement("select");
    const defOpt = document.createElement("option");
    defOpt.textContent = "-";
    sVar.appendChild(defOpt);
    vars.forEach(v => {
      const o = document.createElement("option");
      o.textContent = v;
      sVar.appendChild(o);
    });

    // Rovná se
    const eq1 = document.createElement("span");
    eq1.textContent = "=";

    // Hodnota
    const inp = document.createElement("input");
    inp.placeholder = "Hodnota";

    // Rovná se 2
    const eq2 = document.createElement("span");
    eq2.textContent = "=";

    // Jednotka
    const sUnit = document.createElement("select");
    const units = ["-", "m", "cm", "km", "N", "kN", "J", "kJ", "kg", "m³", "g/cm³"];
    units.forEach(u => {
      const o = document.createElement("option");
      o.textContent = u;
      sUnit.appendChild(o);
    });

    // Checkbox hledané veličiny
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.title = "Hledaná veličina";
    cb.addEventListener("change", () => {
      inp.value = cb.checked ? "?" : "";
    });

    row.appendChild(sVar);
    row.appendChild(eq1);
    row.appendChild(inp);
    row.appendChild(eq2);
    row.appendChild(sUnit);
    row.appendChild(cb);
    return row;
  }

  // bezpečnostní značka (pro detekci v HTML)
  window.scriptInitialized = true;
  console.log("✅ Aplikace inicializována");
});
