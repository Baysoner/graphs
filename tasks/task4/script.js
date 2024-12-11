// Инициализация данных для сети
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);
let graph = { nodes: nodes, edges: edges }; // Граф для алгоритма

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

// Поиск кратчайшего пути
async function startShortestPath() {
  const source = prompt("Введите ID начального узла:");
  const sink = prompt("Введите ID конечного узла:");

  const { path, cost } = dijkstra(source, sink);

  if (path) {
    log(
      `Кратчайший путь от узла ${source} до узла ${sink}: ${path.join(
        " -> "
      )} с общей стоимостью ${cost}`
    );
    await highlightPath(path);
  } else {
    log(`Нет доступного пути от узла ${source} до узла ${sink}.`);
  }
}

// Алгоритм Дейкстры
function dijkstra(start, end) {
  const distances = {};
  const previous = {};
  const queue = new Set();

  nodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    queue.add(node.id);
  });

  distances[start] = 0;

  while (queue.size) {
    const currentNode = Array.from(queue).reduce((minNode, node) =>
      distances[node] < distances[minNode] ? node : minNode
    );

    if (currentNode === end) {
      const path = [];
      let current = end;

      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }

      return { path, cost: distances[end] };
    }

    queue.delete(currentNode);

    edges.get().forEach((edge) => {
      if (edge.from === currentNode && queue.has(edge.to)) {
        const newDist = distances[currentNode] + edge.weight;
        if (newDist < distances[edge.to]) {
          distances[edge.to] = newDist;
          previous[edge.to] = currentNode;
        }
      }
    });
  }

  return { path: null, cost: Infinity };
}

// Подсветка пути
async function highlightPath(path) {
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    highlightEdge(from, to, "green");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Задержка для визуализации
  }
}

// Подсветка рёбер
function highlightEdge(from, to, color) {
  edges.get().forEach((edge) => {
    if (edge.from === from && edge.to === to) {
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
