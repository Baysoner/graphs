let nodes = new vis.DataSet([]);
let edges = new vis.DataSet([]);
let container = document.getElementById("mynetwork");
let data = { nodes: nodes, edges: edges };

// Настройки сети с стрелками на рёбрах
let options = {
  edges: {
    arrows: {
      to: { enabled: true, scaleFactor: 1 },
    },
    smooth: false,
    width: 1,
  },
};

let network = new vis.Network(container, data, options);

function addNode() {
  const nodeId = document.getElementById("nodeId").value;
  if (nodeId) {
    nodes.add({ id: nodeId, label: `Узел ${nodeId}` });
    document.getElementById("nodeId").value = "";
    updateAdjacencyMatrix();
  }
}

function addEdge() {
  const fromNode = document.getElementById("fromNode").value;
  const toNode = document.getElementById("toNode").value;
  const edgeWeight = document.getElementById("edgeWeight").value;

  if (fromNode && toNode) {
    edges.add({ from: fromNode, to: toNode, label: edgeWeight });
    document.getElementById("fromNode").value = "";
    document.getElementById("toNode").value = "";
    document.getElementById("edgeWeight").value = "";
    updateAdjacencyMatrix();
  }
}

function removeSelected() {
  const selectedNodes = network.getSelectedNodes();
  const selectedEdges = network.getSelectedEdges();

  if (selectedNodes.length > 0) {
    nodes.remove(selectedNodes);
    edges.remove(
      edges
        .get()
        .filter(
          (edge) =>
            edge.from === selectedNodes[0] || edge.to === selectedNodes[0]
        )
    );
  } else if (selectedEdges.length > 0) {
    edges.remove(selectedEdges);
  }

  updateAdjacencyMatrix();
}

function saveGraph() {
  const matrix = generateAdjacencyMatrix(nodes.get(), edges.get());
  const blob = new Blob([JSON.stringify(matrix)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph_matrix.json";
  a.click();
  URL.revokeObjectURL(url);
}

function generateAdjacencyMatrix(nodeArray, edgeArray) {
  const matrix = Array(nodeArray.length)
    .fill()
    .map(() => Array(nodeArray.length).fill(0));

  edgeArray.forEach((edge) => {
    const fromIndex = nodeArray.findIndex((node) => node.id === edge.from);
    const toIndex = nodeArray.findIndex((node) => node.id === edge.to);
    if (fromIndex !== -1 && toIndex !== -1) {
      matrix[fromIndex][toIndex] = edge.label; // Устанавливаем вес ребра
    }
  });

  return matrix;
}

function loadGraph() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const matrix = JSON.parse(event.target.result);
      nodes.clear();
      edges.clear();

      // Восстановление узлов и рёбер из матрицы
      matrix.forEach((row, rowIndex) => {
        nodes.add({ id: rowIndex.toString(), label: `Узел ${rowIndex}` });
        row.forEach((value, colIndex) => {
          if (value > 0) {
            edges.add({
              from: rowIndex.toString(),
              to: colIndex.toString(),
              label: value,
            });
          }
        });
      });

      updateAdjacencyMatrix();
    };
    reader.readAsText(file);
  }
}

async function startDFS() {
  const visited = new Set();
  const delay = parseInt(document.getElementById("delay").value);
  const logArea = document.getElementById("log");

  async function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    highlightNode(nodeId);
    logArea.innerHTML += `Посещен узел: ${nodeId}<br>`;
    await sleep(delay);

    const neighbors = edges
      .get()
      .filter((edge) => edge.from === nodeId || edge.to === nodeId);
    for (const edge of neighbors) {
      const nextNode = edge.from === nodeId ? edge.to : edge.from;
      await dfs(nextNode);
    }
  }

  const startNode = nodes.get()[0]; // Начинаем с первого узла
  if (startNode) {
    await dfs(startNode.id);
  }
}

async function startBFS() {
  const visited = new Set();
  const queue = [];
  const delay = parseInt(document.getElementById("delay").value);
  const logArea = document.getElementById("log");

  const startNode = nodes.get()[0]; // Начинаем с первого узла
  if (startNode) {
    queue.push(startNode.id);
    visited.add(startNode.id);
    highlightNode(startNode.id);
    logArea.innerHTML += `Посещен узел: ${startNode.id}<br>`;
  }

  while (queue.length > 0) {
    const nodeId = queue.shift();
    await sleep(delay);

    const neighbors = edges
      .get()
      .filter((edge) => edge.from === nodeId || edge.to === nodeId);
    for (const edge of neighbors) {
      const nextNode = edge.from === nodeId ? edge.to : edge.from;
      if (!visited.has(nextNode)) {
        visited.add(nextNode);
        queue.push(nextNode);
        highlightNode(nextNode);
        logArea.innerHTML += `Посещен узел: ${nextNode}<br>`;
      }
    }
  }
}

function highlightNode(nodeId) {
  network.selectNodes([nodeId]);
  setTimeout(() => network.selectNodes([]), 500);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateAdjacencyMatrix() {
  const nodeArray = nodes.get();
  const matrix = Array(nodeArray.length)
    .fill()
    .map(() => Array(nodeArray.length).fill(0));

  edges.get().forEach((edge) => {
    const fromIndex = nodeArray.findIndex((node) => node.id === edge.from);
    const toIndex = nodeArray.findIndex((node) => node.id === edge.to);
    if (fromIndex !== -1 && toIndex !== -1) {
      matrix[fromIndex][toIndex] = edge.label; // Устанавливаем вес ребра
    }
  });

  renderAdjacencyMatrix(nodeArray, matrix);
}

function renderAdjacencyMatrix(nodes, matrix) {
  const table = document.getElementById("adjacencyMatrix");
  table.innerHTML = ""; // Очищаем предыдущую матрицу

  // Заголовок таблицы
  const headerRow = document.createElement("tr");
  headerRow.appendChild(document.createElement("th")); // Пустая ячейка для верхнего левого угла
  nodes.forEach((node) => {
    const th = document.createElement("th");
    th.textContent = node.id;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Заполнение матрицы
  nodes.forEach((node, rowIndex) => {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = node.id; // ID узла в первой ячейке строки
    row.appendChild(th);
    matrix[rowIndex].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      row.appendChild(td);
    });
    table.appendChild(row);
  });
}
