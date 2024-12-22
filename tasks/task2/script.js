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
  physics: {
    enabled: true, // Включение физики для автоматической расстановки узлов
    solver: "forceAtlas2Based", // Метод для раскладки
    stabilization: { iterations: 1000, updateInterval: 25 }, // Параметры стабилизации
  },
};
const network = new vis.Network(container, data, options);

// Добавление узла с случайным положением
function addNode() {
  const nodeId = document.getElementById("nodeId").value;
  if (nodeId) {
    // Генерация случайных координат для узла
    const x = Math.floor(Math.random() * 500); // Случайная координата X
    const y = Math.floor(Math.random() * 500); // Случайная координата Y
    nodes.add({ id: nodeId, label: `Узел ${nodeId}`, x: x, y: y });
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
      flow: 0, // Инициализация потока для рёбер
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
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "graph.json";
  link.click();
}

// Загрузка графа из файла
function loadGraph() {
  const file = document.getElementById("fileInput").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const graph = JSON.parse(event.target.result);
      nodes.clear();
      edges.clear();
      nodes.add(graph.nodes);
      edges.add(graph.edges);
    };
    reader.readAsText(file);
  }
}

// Функция для поиска максимального потока с пошаговой визуализацией
async function startMaxFlow() {
  const source = prompt("Введите ID начального узла:");
  const sink = prompt("Введите ID конечного узла:");
  const delay = parseInt(document.getElementById("stepDelay").value) || 1000; // Задержка по умолчанию 1000 мс

  // Подсветка узлов
  highlightNode(source, "red");
  highlightNode(sink, "blue");

  const maxFlow = await edmondsKarp(graph, source, sink, delay);
  log(`Максимальный поток от узла ${source} до узла ${sink}: ${maxFlow}`);
}

// Подсветка узлов
function highlightNode(nodeId, color) {
  const node = nodes.get(nodeId);
  if (node) {
    node.color = color;
    nodes.update(node);
  }
}

// Алгоритм Эдмондса-Карпа (поиск максимального потока) с пошаговой визуализацией
async function edmondsKarp(graph, source, sink, delay) {
  let maxFlow = 0;
  let path;

  // Преобразуем рёбра в структуру для поиска потока
  const residualGraph = createResidualGraph(graph);

  while ((path = bfs(residualGraph, source, sink)) !== null) {
    let pathFlow = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      pathFlow = Math.min(pathFlow, residualGraph[u][v]);
    }

    // Обновляем остаточную графовую сеть и визуализацию
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      residualGraph[u][v] -= pathFlow;
      residualGraph[v][u] += pathFlow;

      // Обновление визуальных значений потока
      await updateFlowVisual(u, v, pathFlow, delay);
    }

    maxFlow += pathFlow;
  }

  return maxFlow;
}

// Функция для обновления визуализации потока
async function updateFlowVisual(from, to, flow, delay) {
  edges.get().forEach((edge) => {
    if (edge.from === from && edge.to === to) {
      edge.flow += flow;
      edge.label = `${edge.flow}/${edge.weight}`;
      log(
        `Ребро от ${from} до ${to}: Пропускная способность ${edge.flow}/${edge.weight}`
      );
    }
  });

  // Обновляем отображение графа
  network.setData({ nodes, edges });

  // Подсветка ребра
  highlightEdge(from, to, "green");

  // Ждем заданное время перед следующей итерацией
  await new Promise((resolve) => setTimeout(resolve, delay));
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

// Функция для создания остаточной графовой сети
function createResidualGraph(graph) {
  const residualGraph = {};
  edges.get().forEach((edge) => {
    const u = edge.from;
    const v = edge.to;
    const weight = edge.weight;

    if (!residualGraph[u]) residualGraph[u] = {};
    if (!residualGraph[v]) residualGraph[v] = {};

    residualGraph[u][v] = weight;
    residualGraph[v][u] = 0; // Обратные рёбра с нулевым потоком
  });
  return residualGraph;
}

// Функция для поиска пути в остаточной сети
function bfs(graph, source, sink) {
  const queue = [source];
  const parent = { [source]: null };

  while (queue.length > 0) {
    const u = queue.shift();

    if (u === sink) {
      const path = [];
      let current = sink;
      while (current !== null) {
        path.unshift(current);
        current = parent[current];
      }
      return path;
    }

    for (let v in graph[u]) {
      if (graph[u][v] > 0 && !parent[v]) {
        parent[v] = u;
        queue.push(v);
      }
    }
  }

  return null;
}

// Логирование шагов
function log(message) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML += `<p>${message}</p>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Логирование шагов алгоритма
function logStep(message) {
  const stepDiv = document.getElementById("stepDescription");
  stepDiv.innerHTML += `<p>${message}</p>`;
}
