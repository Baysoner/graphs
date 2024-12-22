// Инициализация данных для сети
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);

const container = document.getElementById("mynetwork");
const data = { nodes, edges };
const options = {
  edges: {
    arrows: { to: false }, // Убираем стрелки для неориентированного графа
    font: { align: "top" },
    color: { color: "#000" },
  },
  nodes: {
    shape: "dot",
    size: 20,
    font: { size: 15, color: "#000" },
  },
  physics: {
    enabled: true, // Включаем физику для нормального расположения узлов
    barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.3,
      springLength: 100,
      springConstant: 0.04,
    },
  },
};
const network = new vis.Network(container, data, options);

// Добавление узла
function addNode() {
  const nodeId = document.getElementById("nodeId").value;
  if (nodeId) {
    nodes.add({ id: nodeId, label: `Узел ${nodeId}`, x: Math.random() * 500, y: Math.random() * 400 }); // Задаем случайные координаты
    document.getElementById("nodeId").value = "";
  }
}

// Добавление ребра
function addEdge() {
  const fromNode = document.getElementById("fromNode").value;
  const toNode = document.getElementById("toNode").value;
  const edgeWeight = parseInt(document.getElementById("edgeWeight").value);
  if (fromNode && toNode && !isNaN(edgeWeight) && edgeWeight > 0) {
    const existingEdge = edges.get().some(edge => 
      (edge.from === fromNode && edge.to === toNode) || 
      (edge.from === toNode && edge.to === fromNode)
    );

    if (!existingEdge) {
      edges.add({
        from: fromNode,
        to: toNode,
        label: `${edgeWeight}`,
        weight: edgeWeight,
      });
    }
    
    document.getElementById("fromNode").value = "";
    document.getElementById("toNode").value = "";
    document.getElementById("edgeWeight").value = "";
  }
}

// Поиск кратчайшего пути
async function startShortestPath() {
  const source = prompt("Введите ID начального узла:");
  const sink = prompt("Введите ID конечного узла:");
  const delay = parseInt(document.getElementById("delayInput").value) || 1000; // Получаем задержку из поля ввода

  const { path, cost } = await dijkstra(source, sink, delay);

  if (path) {
    log(
      `Кратчайший путь от узла ${source} до узла ${sink}: ${path.join(
        " <-> "
      )} с общей стоимостью ${cost}`
    );
    await highlightPath(path, delay);
  } else {
    log(`Нет доступного пути от узла ${source} до узла ${sink}.`);
  }
}

// Алгоритм Дейкстры
async function dijkstra(start, end, delay) {
  const distances = {};
  const previous = {};
  const queue = new Set();

  // Инициализация расстояний и цвета узлов
  nodes.forEach((node) => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    queue.add(node.id);
    // Устанавливаем цвет узлов на серый (бесконечно далеко)
    nodes.update({ id: node.id, color: { background: "#cccccc", border: "#666666" } });
  });

  distances[start] = 0;
  log(`Инициализация завершена. Начальная вершина: ${start}`);
  nodes.update({ id: start, color: { background: "#ffcc00", border: "#cc9900" } }); // Устанавливаем цвет начального узла

  while (queue.size) {
    const currentNode = Array.from(queue).reduce((minNode, node) =>
      distances[node] < distances[minNode] ? node : minNode
    );

    log(`Текущая вершина: ${currentNode}`);
    nodes.update({ id: currentNode, color: { background: "#66ff66", border: "#009900" } }); // Устанавливаем цвет текущего узла

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
      if ((edge.from === currentNode || edge.to === currentNode) && queue.has(edge.from === currentNode ? edge.to : edge.from)) {
        const neighbor = edge.from === currentNode ? edge.to : edge.from;
        const newDist = distances[currentNode] + edge.weight;

        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previous[neighbor] = currentNode;
          log(`Обновлено расстояние до узла ${neighbor}: ${newDist}`);
          nodes.update({ id: neighbor, color: { background: "#ffcc00", border: "#cc9900" } }); // Устанавливаем цвет обновленного узла
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, delay)); // Задержка для визуализации
  }

  return { path: null, cost: Infinity };
}

// Подсветка пути
async function highlightPath(path, delay) {
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    highlightEdge(from, to, "green");
    await new Promise((resolve) => setTimeout(resolve, delay)); // Задержка для визуализации
  }
}

// Подсветка рёбер
function highlightEdge(from, to, color) {
  edges.get().forEach((edge) => {
    if ((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)) {
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

// Сохранение графа
function saveGraph() {
  const matrix = generateAdjacencyMatrix(nodes.get(), edges.get());
  const blob = new Blob([JSON.stringify(matrix)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph_matrix.json";
  document.body.appendChild(a); // Добавляем элемент в DOM
  a.click();
  document.body.removeChild(a); // Удаляем элемент после загрузки
  URL.revokeObjectURL(url);
}

// Генерация матрицы смежности
function generateAdjacencyMatrix(nodeArray, edgeArray) {
  const matrix = Array(nodeArray.length)
    .fill()
    .map(() => Array(nodeArray.length).fill(0));

  edgeArray.forEach((edge) => {
    const fromIndex = nodeArray.findIndex((node) => node.id === edge.from);
    const toIndex = nodeArray.findIndex((node) => node.id === edge.to);
    if (fromIndex !== -1 && toIndex !== -1) {
      matrix[fromIndex][toIndex] = edge.weight; // Устанавливаем вес ребра
      // Убираем дублирование для неориентированного графа
      if (matrix[toIndex][fromIndex] === 0) {
        matrix[toIndex][fromIndex] = edge.weight; // Устанавливаем вес для обратного ребра
      }
    }
  });

  return matrix;
}

// Загрузка графа
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
        nodes.add({ id: rowIndex.toString(), label: `Узел ${rowIndex}`, x: Math.random() * 500, y: Math.random() * 400 }); // Задаем случайные координаты
        row.forEach((value, colIndex) => {
          if (value > 0) {
            const existingEdge = edges.get().some(edge => 
              (edge.from === rowIndex.toString() && edge.to === colIndex.toString()) || 
              (edge.from === colIndex.toString() && edge.to === rowIndex.toString())
            );

            if (!existingEdge) {
              edges.add({
                from: rowIndex.toString(),
                to: colIndex.toString(),
                label: value.toString(), // Преобразуем в строку для метки
                weight: value, // Устанавливаем вес ребра
              });
            }
          }
        });
      });

      log("Граф успешно загружен из файла.");
    };
    reader.readAsText(file);
  }
}
