const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);
const container = document.getElementById("mynetwork");
const data = { nodes, edges };
const options = {
  edges: {
    arrows: { to: true },
    font: { align: "top" },
    color: { color: "#000" },
  },
  nodes: {
    shape: "dot",
    size: 20,
    font: { size: 15, color: "#000" },
  },
  physics: { enabled: false },
};
const network = new vis.Network(container, data, options);

// Добавление узла
function addNode() {
  const nodeId = document.getElementById("nodeId").value;
  if (nodeId) {
    nodes.add({ id: nodeId, label: `Узел ${nodeId}` });
    document.getElementById("nodeId").value = "";
  }
}

// Добавление ребра
function addEdge() {
  const fromNode = document.getElementById("fromNode").value;
  const toNode = document.getElementById("toNode").value;
  const edgeWeight = parseInt(document.getElementById("edgeWeight").value);
  if (fromNode && toNode && !isNaN(edgeWeight) && edgeWeight > 0) {
    edges.add({
      from: fromNode,
      to: toNode,
      label: `${edgeWeight}`,
      weight: edgeWeight,
    });
    document.getElementById("fromNode").value = "";
    document.getElementById("toNode").value = "";
    document.getElementById("edgeWeight").value = "";
  }
}

// Удаление выбранных элементов
function removeSelected() {
  const selectedNodes = network.getSelectedNodes();
  const selectedEdges = network.getSelectedEdges();
  if (selectedNodes.length) nodes.remove(selectedNodes);
  if (selectedEdges.length) edges.remove(selectedEdges);
}

// Сохранение графа в файл
function saveGraph() {
  const graph = { nodes: nodes.get(), edges: edges.get() };
  const blob = new Blob([JSON.stringify(graph)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Загрузка графа из файла
async function loadGraph(event) {
  const file = event.target.files[0];
  if (file) {
    const text = await file.text();
    const graph = JSON.parse(text);
    nodes.clear();
    edges.clear();
    nodes.add(graph.nodes);
    edges.add(graph.edges);
  }
}

// Алгоритм Краскала для построения минимального остовного дерева
async function kruskal() {
  const edgesArray = edges.get();
  edgesArray.sort((a, b) => a.weight - b.weight); // Сортируем по весу

  const parent = {};
  const rank = {};

  edgesArray.forEach((edge) => {
    parent[edge.from] = edge.from;
    parent[edge.to] = edge.to;
    rank[edge.from] = 0;
    rank[edge.to] = 0;
  });

  const find = (node) => {
    if (parent[node] !== node) {
      parent[node] = find(parent[node]);
    }
    return parent[node];
  };

  const union = (node1, node2) => {
    const root1 = find(node1);
    const root2 = find(node2);
    if (root1 !== root2) {
      if (rank[root1] > rank[root2]) {
        parent[root2] = root1;
      } else if (rank[root1] < rank[root2]) {
        parent[root1] = root2;
      } else {
        parent[root2] = root1;
        rank[root1]++;
      }
    }
  };

  const mstEdges = [];
  for (const edge of edgesArray) {
    const { from, to } = edge;
    if (find(from) !== find(to)) {
      union(from, to);
      mstEdges.push(edge);
      highlightEdge(from, to, "blue");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Задержка для визуализации
    }
  }

  log(
    `Минимальное остовное дерево: ${mstEdges
      .map((e) => `${e.from} - ${e.to} (вес: ${e.weight})`)
      .join(", ")}`
  );
}

// Подсветка рёбер
function highlightEdge(from, to, color) {
  edges.get().forEach((edge) => {
    if (
      (edge.from === from && edge.to === to) ||
      (edge.from === to && edge.to === from)
    ) {
      edge.color = color;
      edges.update(edge);
    }
  });
}

// Логирование шагов
function log(message) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML += `<p>${message}</p>`;
}
