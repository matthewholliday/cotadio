const SPICE = {
  baby: { color: "#ffb7d5", label: "Baby Spice", vibe: "sweet commits & soft merges" },
  scary: { color: "#ff4d6d", label: "Scary Spice", vibe: "bold refactors, no fear" },
  sporty: { color: "#7dffaf", label: "Sporty Spice", vibe: "CI green, ship fast" },
  ginger: { color: "#ff9f43", label: "Ginger Spice", vibe: "hot fixes & spicy diffs" },
  posh: { color: "#e8e8f0", label: "Posh Spice", vibe: "elegant architecture" },
};

const COMMITS = [
  { id: "a1f2", branch: "main", spice: "posh", msg: "Merge feature/spice-search into main", author: "Posh", date: "2026-06-13" },
  { id: "b3c4", branch: "feature/spice-search", spice: "ginger", msg: "Add fuzzy search over commit history", author: "Ginger", date: "2026-06-12" },
  { id: "d5e6", branch: "feature/spice-search", spice: "sporty", msg: "Optimize ripple shader for Quest panels", author: "Sporty", date: "2026-06-12" },
  { id: "f7g8", branch: "main", spice: "baby", msg: "Soften glass morphism on search panel", author: "Baby", date: "2026-06-11" },
  { id: "h9i0", branch: "feature/water-flow", spice: "scary", msg: "Ripple physics: tell me what you want", author: "Scary", date: "2026-06-10" },
  { id: "j1k2", branch: "feature/water-flow", spice: "baby", msg: "Initial water canvas with caustic glow", author: "Baby", date: "2026-06-09" },
  { id: "l3m4", branch: "main", spice: "sporty", msg: "Quest-style dock launcher", author: "Sporty", date: "2026-06-08" },
  { id: "n5o6", branch: "main", spice: "ginger", msg: "SpiceFlow OS bootstrap", author: "Ginger", date: "2026-06-07" },
];

const WISDOM = [
  { spice: "baby", title: "Friendship never ends", snippet: "If you wanna be my lover, you gotta get with my friends. Also: rebase before merge." },
  { spice: "scary", title: "Tell me what you want", snippet: "What you really really want is a clean git history and expressive commit messages." },
  { spice: "sporty", title: "Slam your body down", snippet: "Slam your CI pipeline down and zig-a-zig-ah through those green checks." },
  { spice: "ginger", title: "Spice up your life", snippet: "Every commit's a chance to spice up your codebase. Hotfix responsibly." },
  { spice: "posh", title: "Girl power in prod", snippet: "Elegance is deleting code. Class is squashing before you push." },
  { spice: "baby", title: "Platform shoes & platform UI", snippet: "Float above the water like a Quest home screen. Depth is an illusion; UX is real." },
  { spice: "scary", title: "Search like Google, branch like Git", snippet: "Instant results from the stream. Version everything. Fear nothing." },
  { spice: "sporty", title: "Hydration branch", snippet: "Stay fluid. Water adapts; so should your feature flags." },
];

const BRANCHES = [
  { name: "main", commits: ["n5o6", "l3m4", "f7g8", "a1f2"], color: "#5ecbff" },
  { name: "feature/spice-search", commits: ["d5e6", "b3c4"], color: "#ff9f43", parent: "main", forkAt: "l3m4" },
  { name: "feature/water-flow", commits: ["j1k2", "h9i0"], color: "#7dffaf", parent: "main", forkAt: "n5o6" },
];

let activeSpice = "all";
let selectedCommit = null;
let currentBranch = "main";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function showToast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2800);
}

function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(re, "<mark>$1</mark>");
}

function search(query) {
  const q = query.trim().toLowerCase();
  const results = [];

  for (const c of COMMITS) {
    if (activeSpice !== "all" && c.spice !== activeSpice) continue;
    const hay = `${c.msg} ${c.branch} ${c.author} ${c.id}`.toLowerCase();
    if (!q || hay.includes(q)) {
      const s = SPICE[c.spice];
      results.push({
        type: "commit",
        title: c.msg,
        meta: `${c.id} · ${c.branch} · ${c.author}`,
        snippet: `Commit on ${c.date}. ${s.vibe}.`,
        spice: c.spice,
        commitId: c.id,
        score: q ? (hay.indexOf(q) === 0 ? 2 : 1) : 0,
      });
    }
  }

  for (const w of WISDOM) {
    if (activeSpice !== "all" && w.spice !== activeSpice) continue;
    const hay = `${w.title} ${w.snippet}`.toLowerCase();
    if (!q || hay.includes(q)) {
      results.push({
        type: "wisdom",
        title: w.title,
        meta: `${SPICE[w.spice].label} · Spice Wisdom`,
        snippet: w.snippet,
        spice: w.spice,
        score: q ? (hay.indexOf(q) === 0 ? 2 : 1) : 0,
      });
    }
  }

  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return results.slice(0, 12);
}

function renderResults(query = "") {
  const results = search(query);
  const list = $("#results");
  $("#result-count").textContent = `${results.length} found`;

  if (!results.length) {
    list.innerHTML = `<li class="muted" style="padding:20px;text-align:center">No matches. Try "water", "merge", or "wannabe".</li>`;
    return;
  }

  list.innerHTML = results
    .map(
      (r) => `
    <li class="result-item" data-commit="${r.commitId || ""}" style="--item-color:${SPICE[r.spice].color}">
      <div class="result-title">${highlight(r.title, query)}</div>
      <div class="result-meta">${r.meta}</div>
      <div class="result-snippet">${highlight(r.snippet, query)}</div>
    </li>`
    )
    .join("");

  list.querySelectorAll(".result-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.commit;
      if (id) selectCommit(id);
      else showToast(el.querySelector(".result-title").textContent);
    });
  });
}

function selectCommit(id) {
  selectedCommit = COMMITS.find((c) => c.id === id);
  if (!selectedCommit) return;
  const s = SPICE[selectedCommit.spice];
  $("#commit-detail").innerHTML = `
    <strong>${selectedCommit.id} · ${selectedCommit.msg}</strong>
    Branch: ${selectedCommit.branch}<br>
    Author: ${selectedCommit.author} (${s.label})<br>
    Date: ${selectedCommit.date}<br><br>
    <span style="color:${s.color}">${s.vibe}</span>
  `;
  drawGitGraph();
  showToast(`Selected ${selectedCommit.id}`);
}

function drawGitGraph() {
  const svg = $("#git-graph");
  const colW = 28;
  const rowH = 36;
  const left = 24;

  const allIds = [];
  const positions = new Map();
  let row = 0;

  for (const b of BRANCHES) {
    for (const id of b.commits) {
      if (!positions.has(id)) {
        positions.set(id, { row, branch: b.name });
        allIds.push(id);
        row++;
      }
    }
  }

  const branchCols = new Map(BRANCHES.map((b, i) => [b.name, i]));

  let paths = "";
  let nodes = "";

  for (const b of BRANCHES) {
    const col = branchCols.get(b.name);
    const x = left + col * colW;
    const pts = b.commits.map((id) => {
      const p = positions.get(id);
      return { x, y: 30 + p.row * rowH, id };
    });

    for (let i = 0; i < pts.length - 1; i++) {
      paths += `<path d="M${pts[i].x},${pts[i].y} L${pts[i + 1].x},${pts[i + 1].y}" stroke="${b.color}" stroke-width="2.5" fill="none" opacity="0.7"/>`;
    }

    if (b.parent && b.forkAt) {
      const fork = positions.get(b.forkAt);
      const first = positions.get(b.commits[0]);
      if (fork && first) {
        const px = left + branchCols.get(b.parent) * colW;
        const py = 30 + fork.row * rowH;
        const cx = left + col * colW;
        const cy = 30 + first.row * rowH;
        paths += `<path d="M${px},${py} C${px + 20},${py} ${cx - 20},${cy} ${cx},${cy}" stroke="${b.color}" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="4 3"/>`;
      }
    }

    for (const pt of pts) {
      const c = COMMITS.find((x) => x.id === pt.id);
      const active = selectedCommit?.id === pt.id;
      const r = active ? 9 : 6;
      nodes += `
        <g class="git-node" data-id="${pt.id}" style="cursor:pointer">
          <circle cx="${pt.x}" cy="${pt.y}" r="${r + 4}" fill="${b.color}" opacity="${active ? 0.35 : 0}"/>
          <circle cx="${pt.x}" cy="${pt.y}" r="${r}" fill="${active ? "#fff" : b.color}" stroke="${active ? b.color : "rgba(255,255,255,0.3)"}" stroke-width="2"/>
          <text x="${pt.x + 14}" y="${pt.y + 4}" fill="rgba(220,230,250,0.7)" font-size="10" font-family="Outfit,sans-serif">${pt.id}</text>
        </g>`;
    }
  }

  svg.innerHTML = `<rect width="100%" height="100%" fill="transparent"/>${paths}${nodes}`;
  svg.querySelectorAll(".git-node").forEach((g) => {
    g.addEventListener("click", () => selectCommit(g.dataset.id));
  });
}

function checkoutBranch() {
  if (!selectedCommit) {
    showToast("Select a commit first");
    return;
  }
  currentBranch = selectedCommit.branch;
  $("#branch-label").textContent = currentBranch;
  showToast(`Checked out ${currentBranch}`);
}

function initSearch() {
  const form = $("#search-form");
  const input = $("#search-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    renderResults(input.value);
    if (input.value.trim()) showToast(`Searching the stream for "${input.value.trim()}"`);
  });

  input.addEventListener("input", () => renderResults(input.value));

  $$(".spice-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".spice-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeSpice = tab.dataset.spice;
      renderResults(input.value);
    });
  });
}

function initDock() {
  $$(".dock-item").forEach((item) => {
    item.addEventListener("click", () => {
      $$(".dock-item").forEach((d) => d.classList.remove("active"));
      item.classList.add("active");
      $(".os").className = `os view-${item.dataset.view}`;
      const msgs = {
        search: "Google-grade search, Quest-grade depth",
        git: "Branch graph front and center",
        water: "Flow mode: ripples intensified",
        spice: "Spice World lighting engaged",
      };
      showToast(msgs[item.dataset.view]);
    });
  });
}

function initWater() {
  const canvas = $("#water");
  const ctx = canvas.getContext("2d");
  const ripples = [];
  let w, h, t = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function addRipple(x, y, strength = 1) {
    ripples.push({ x, y, r: 0, max: 80 + strength * 60, life: 1, strength });
    if (ripples.length > 24) ripples.shift();
  }

  function draw() {
    t += 0.012;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0a1628");
    grad.addColorStop(0.45, "#0d2840");
    grad.addColorStop(1, "#051018");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 4) {
      const wave =
        Math.sin(y * 0.012 + t * 2) * 8 +
        Math.sin(y * 0.006 - t) * 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 12) {
        const wx =
          Math.sin(x * 0.008 + t + y * 0.003) * 6 + wave;
        ctx.lineTo(x, y + wx * 0.15);
      }
      ctx.strokeStyle = `rgba(60, 140, 200, ${0.03 + Math.sin(t + y * 0.01) * 0.015})`;
      ctx.stroke();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 2.2;
      rp.life -= 0.012;
      if (rp.life <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(120, 210, 255, ${rp.life * 0.35 * rp.strength})`;
      ctx.lineWidth = 2 * rp.life;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 230, 255, ${rp.life * 0.15})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const cx = w * 0.5 + Math.sin(t) * 40;
    const cy = h * 0.35 + Math.cos(t * 0.7) * 20;
    const caustic = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    caustic.addColorStop(0, "rgba(80, 180, 255, 0.08)");
    caustic.addColorStop(0.5, "rgba(40, 120, 180, 0.03)");
    caustic.addColorStop(1, "transparent");
    ctx.fillStyle = caustic;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => {
    if (Math.random() < 0.04) addRipple(e.clientX, e.clientY, 0.3);
  });
  window.addEventListener("click", (e) => addRipple(e.clientX, e.clientY, 1.2));

  resize();
  draw();
  setInterval(() => addRipple(Math.random() * w, Math.random() * h * 0.6, 0.5), 2200);
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);
  initWater();
  initSearch();
  initDock();
  drawGitGraph();
  renderResults("");
  selectCommit("a1f2");
  $("#checkout-btn").addEventListener("click", checkoutBranch);
}

init();
