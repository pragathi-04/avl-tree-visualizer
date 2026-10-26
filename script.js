(() => {
  const $ = (id) => document.getElementById(id);
  const svg = $("treeSvg");
  const NS = "http://www.w3.org/2000/svg";
  let root = null;
  let traversalMode = "inorder";
  let lastRotated = new Set();

  class Node {
    constructor(value) { this.value = value; this.left = null; this.right = null; this.height = 1; }
  }
  const height = (node) => node ? node.height : 0;
  const balance = (node) => node ? height(node.left) - height(node.right) : 0;
  const update = (node) => { node.height = 1 + Math.max(height(node.left), height(node.right)); return node; };

  function rightRotate(y) {
    const x = y.left, middle = x.right;
    x.right = y; y.left = middle;
    update(y); update(x); lastRotated.add(x.value); lastRotated.add(y.value);
    return x;
  }
  function leftRotate(x) {
    const y = x.right, middle = y.left;
    y.left = x; x.right = middle;
    update(x); update(y); lastRotated.add(x.value); lastRotated.add(y.value);
    return y;
  }
  function insert(node, value) {
    if (!node) return new Node(value);
    if (value < node.value) node.left = insert(node.left, value);
    else if (value > node.value) node.right = insert(node.right, value);
    else throw new Error("That value already exists. Try a different integer.");
    update(node);
    const bf = balance(node);
    if (bf > 1 && value < node.left.value) return rightRotate(node);             // LL
    if (bf < -1 && value > node.right.value) return leftRotate(node);            // RR
    if (bf > 1 && value > node.left.value) { node.left = leftRotate(node.left); return rightRotate(node); } // LR
    if (bf < -1 && value < node.right.value) { node.right = rightRotate(node.right); return leftRotate(node); } // RL
    return node;
  }
  function minNode(node) { let current = node; while (current.left) current = current.left; return current; }
  function remove(node, value) {
    if (!node) return null;
    if (value < node.value) node.left = remove(node.left, value);
    else if (value > node.value) node.right = remove(node.right, value);
    else {
      if (!node.left || !node.right) node = node.left || node.right;
      else { const successor = minNode(node.right); node.value = successor.value; node.right = remove(node.right, successor.value); }
    }
    if (!node) return null;
    update(node);
    const bf = balance(node);
    if (bf > 1 && balance(node.left) >= 0) return rightRotate(node);
    if (bf > 1 && balance(node.left) < 0) { node.left = leftRotate(node.left); return rightRotate(node); }
    if (bf < -1 && balance(node.right) <= 0) return leftRotate(node);
    if (bf < -1 && balance(node.right) > 0) { node.right = rightRotate(node.right); return leftRotate(node); }
    return node;
  }
  function find(node, value) { while (node) { if (value === node.value) return node; node = value < node.value ? node.left : node.right; } return null; }
  function values(node, order, out = []) {
    if (!node) return out;
    if (order === "preorder") out.push(node.value);
    values(node.left, order, out);
    if (order === "inorder") out.push(node.value);
    values(node.right, order, out);
    if (order === "postorder") out.push(node.value);
    return out;
  }
  function allNodes(node, out = []) { if (!node) return out; out.push(node); allNodes(node.left, out); allNodes(node.right, out); return out; }
  function svgEl(tag, attrs = {}) { const el = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v)); return el; }
  function render() {
    const stage = $("treeStage"), empty = $("emptyState");
    svg.innerHTML = "";
    const nodes = allNodes(root);
    empty.style.display = nodes.length ? "none" : "flex";
    svg.style.display = nodes.length ? "block" : "none";
    $("nodeCount").textContent = nodes.length;
    $("heightValue").textContent = height(root);
    $("treeSummary").textContent = `${nodes.length} node${nodes.length === 1 ? "" : "s"} · height ${height(root)}`;
    $("minValue").textContent = root ? Math.min(...nodes.map(n => n.value)) : "—";
    $("maxValue").textContent = root ? Math.max(...nodes.map(n => n.value)) : "—";
    const healthy = nodes.every(n => Math.abs(balance(n)) <= 1);
    $("balanceTitle").textContent = healthy ? "Perfectly balanced" : "Balance needs attention";
    $("balanceDescription").textContent = healthy ? "Every node has a balance factor of −1, 0, or +1." : "An imbalance was detected in the current tree.";
    $("traversalOutput").innerHTML = "";
    const ordered = values(root, traversalMode);
    if (!ordered.length) $("traversalOutput").textContent = "—";
    ordered.forEach((v, i) => { const chip = document.createElement("span"); chip.className = "number-chip"; chip.textContent = v; chip.title = `Visit ${i + 1}`; $("traversalOutput").appendChild(chip); });
    if (!root) { lastRotated.clear(); return; }

    const width = Math.max(stage.clientWidth, 320), heightPx = Math.max(stage.clientHeight, 250);
    svg.setAttribute("viewBox", `0 0 ${width} ${heightPx}`);
    const positions = new Map();
    let index = 0;
    const maxDepth = height(root);
    function assign(node, depth) {
      if (!node) return;
      assign(node.left, depth + 1);
      positions.set(node, { x: (index + 0.5) * width / nodes.length, y: 42 + depth * Math.min(72, (heightPx - 90) / Math.max(1, maxDepth - 1)) });
      index++;
      assign(node.right, depth + 1);
    }
    assign(root, 0);
    const links = svgEl("g", {stroke:"#42516d","stroke-width":"1.5","stroke-linecap":"round",fill:"none"});
    function drawLinks(node) {
      if (!node) return;
      const p = positions.get(node);
      [node.left, node.right].forEach(child => {
        if (child) { const c = positions.get(child); links.appendChild(svgEl("path", {d:`M ${p.x} ${p.y+20} C ${p.x} ${p.y+36}, ${c.x} ${c.y-34}, ${c.x} ${c.y-21}`})); }
      });
      drawLinks(node.left); drawLinks(node.right);
    }
    drawLinks(root); svg.appendChild(links);
    const nodeLayer = svgEl("g");
    nodes.forEach(node => {
      const p = positions.get(node), isRotated = lastRotated.has(node.value), bf = balance(node);
      const group = svgEl("g", {transform:`translate(${p.x},${p.y})`,class:"tree-node"});
      group.appendChild(svgEl("circle",{r:"20",fill:isRotated?"#332d55":"#123b3a",stroke:isRotated?"#a99bff":"#65f0c1","stroke-width":"1.6"}));
      const number = svgEl("text",{x:"0",y:"4","text-anchor":"middle",fill:"#f0f7ff","font-size":"12","font-family":"DM Mono, monospace","font-weight":"500"});
      number.textContent = node.value; group.appendChild(number);
      const bfBadge = svgEl("g",{transform:"translate(14,-20)"});
      bfBadge.appendChild(svgEl("circle",{r:"9",fill:Math.abs(bf)>1?"#542a3a":"#26334d",stroke:Math.abs(bf)>1?"#ff7d91":"#64738e","stroke-width":".8"}));
      const bfText = svgEl("text",{x:"0",y:"3","text-anchor":"middle",fill:Math.abs(bf)>1?"#ffb6c0":"#bdc9dd","font-size":"9","font-family":"DM Mono, monospace"});
      bfText.textContent = bf > 0 ? `+${bf}` : `${bf}`; bfBadge.appendChild(bfText); group.appendChild(bfBadge);
      if (isRotated) { group.appendChild(svgEl("circle",{r:"25",fill:"none",stroke:"#a99bff","stroke-width":"1","stroke-dasharray":"3 4",opacity:".8"})); }
      nodeLayer.appendChild(group);
    });
    svg.appendChild(nodeLayer);
    lastRotated.clear();
  }
  function message(text, type = "") { const el = $("operationMessage"); el.textContent = text; el.className = `message ${type}`; }
  function getInput() { const raw = $("valueInput").value.trim(); if (raw === "" || !Number.isSafeInteger(Number(raw))) { message("Please enter a valid safe integer.", "error"); return null; } return Number(raw); }
  function addValue(value) {
    lastRotated.clear();
    try { root = insert(root, value); const rotated = lastRotated.size > 0; render(); message(`Inserted ${value}. ${rotated ? "A balancing rotation was performed." : "Tree remains balanced."}`, "success"); }
    catch (err) { message(err.message, "error"); }
  }
  $("operationForm").addEventListener("submit", e => { e.preventDefault(); const value = getInput(); if (value !== null) { addValue(value); $("valueInput").select(); } });
  $("searchBtn").addEventListener("click", () => { const value = getInput(); if (value === null) return; const node = find(root, value); message(node ? `Found ${value}. Its balance factor is ${balance(node)}.` : `${value} is not present in this tree.`, node ? "success" : "error"); });
  $("deleteBtn").addEventListener("click", () => { const value = getInput(); if (value === null) return; if (!find(root, value)) { message(`${value} is not in the tree, so nothing was deleted.`, "error"); return; } lastRotated.clear(); root = remove(root, value); render(); message(`Deleted ${value} and rebalanced the tree if needed.`, "success"); });
  function clearTree() { root = null; lastRotated.clear(); render(); message("Tree cleared. Insert a value to start again."); }
  $("clearBtn").addEventListener("click", clearTree);
  $("resetBtn").addEventListener("click", clearTree);
  $("sampleBtn").addEventListener("click", () => { root = null; lastRotated.clear(); [30,20,10,25,28,40,50,22].forEach(v => root = insert(root,v)); render(); message("Sample loaded. Explore search, delete, and traversal modes.", "success"); });
  $("randomBtn").addEventListener("click", () => { root = null; lastRotated.clear(); const nums = new Set(); while(nums.size < 8) nums.add(Math.floor(Math.random()*89)+10); nums.forEach(v => root = insert(root,v)); render(); message("Generated 8 unique values and balanced the tree.", "success"); });
  document.querySelectorAll("[data-traversal]").forEach(btn => btn.addEventListener("click", () => { traversalMode = btn.dataset.traversal; document.querySelectorAll("[data-traversal]").forEach(b => b.classList.toggle("active", b === btn)); render(); }));
  document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => { const learn = btn.dataset.view === "learn"; $("visualizerView").classList.toggle("hidden", learn); $("learnView").classList.toggle("hidden", !learn); document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b === btn)); }));
  window.addEventListener("resize", render);
  render();
})();