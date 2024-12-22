const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);
const container = document.getElementById("mynetwork");
const data = { nodes, edges };
const options = {
    edges: {
        arrows: { to: false }, // Убираем стрелки
        font: { align: "top" },
        color: { color: "#000" },
    },
    nodes: {
        shape: "dot",
        size: 20,
        font: { size: 15, color: "#000" },
    },
    physics: {
        enabled: true, // Включаем физику
        solver: 'barnesHut', // Используем алгоритм для равномерного распределения
        barnesHut: {
            gravitationalConstant: -20000,
            centralGravity: 0.3,
            springLength: 95,
            springConstant: 0.04,
        },
    },
};

const network = new vis.Network(container, data, options);

// Добавление узла
function addNode() {
    const nodeId = document.getElementById("nodeId").value;
    if (nodeId) {
        nodes.add({ id: nodeId, label: `Узел ${nodeId}` });
        log(`Добавлен узел: ${nodeId}`);
        document.getElementById("nodeId").value = "";
    }
}

// Добавление ребра
function addEdge() {
    const fromNode = document.getElementById("fromNode").value;
    const toNode = document.getElementById("toNode").value;
    const edgeWeight = parseInt(document.getElementById("edgeWeight").value);
    if (fromNode && toNode && !isNaN(edgeWeight) && edgeWeight > 0) {
        // Добавляем ребро как неориентированное
        edges.add({
            from: fromNode,
            to: toNode,
            label: `${edgeWeight}`,
            weight: edgeWeight,
        });
        edges.add({
            from: toNode,
            to: fromNode,
            label: `${edgeWeight}`,
            weight: edgeWeight,
        });
        log(`Добавлено ребро: ${fromNode} - ${toNode} (вес: ${edgeWeight})`);
        document.getElementById("fromNode").value = "";
        document.getElementById("toNode").value = "";
        document.getElementById("edgeWeight").value = "";
    }
}

// Удаление выбранных элементов
function removeSelected() {
    const selectedNodes = network.getSelectedNodes();
    const selectedEdges = network.getSelectedEdges();
    if (selectedNodes.length) {
        nodes.remove(selectedNodes);
        log(`Удалены узлы: ${selectedNodes.join(", ")}`);
    }
    if (selectedEdges.length) {
        edges.remove(selectedEdges);
        log(`Удалены рёбра: ${selectedEdges.join(", ")}`);
    }
}

// Алгоритм Краскала для построения минимального остовного дерева
async function kruskal() {
    const edgesArray = edges.get();
    edgesArray.sort((a, b) => a.weight - b.weight); // Сортируем по весу

    const parent = {};
    const rank = {};

    // Инициализация: каждый узел является корнем своего подмножества
    edgesArray.forEach((edge) => {
        parent[edge.from] = edge.from;
        parent[edge.to] = edge.to;
        rank[edge.from] = 0;
        rank[edge.to] = 0;
        log(`Инициализация: ${edge.from} и ${edge.to} имеют родителя ${edge.from}`);
    });

    const find = (node) => {
        if (parent[node] !== node) {
            parent[node] = find(parent[node]); // Сжатие пути
        }
        return parent[node];
    };

    const union = (node1, node2) => {
        const root1 = find(node1);
        const root2 = find(node2);
        if (root1 !== root2) {
            if (rank[root1] > rank[root2]) {
                parent[root2] = root1;
                log(`Объединение: ${node1} и ${node2} - корень ${root1} становится родителем ${root2}`);
            } else if (rank[root1] < rank[root2]) {
                parent[root1] = root2;
                log(`Объединение: ${node1} и ${node2} - корень ${root2} становится родителем ${root1}`);
            } else {
                parent[root2] = root1;
                rank[root1]++;
                log(`Объединение: ${node1} и ${node2} - корень ${root1} становится родителем ${root2}`);
            }
        } else {
            log(`Не объединяем: ${node1} и ${node2} - уже в одном компоненте`);
        }
    };

    const mstEdges = [];
    for (const edge of edgesArray) {
        const { from, to } = edge;
        log(`Проверка ребра: ${from} - ${to} (вес: ${edge.weight})`);
        if (find(from) !== find(to)) {
            union(from, to);
            mstEdges.push(edge);
            highlightEdge(from, to, "blue");
            log(`Добавлено ребро в остовное дерево: ${from} - ${to} (вес: ${edge.weight})`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Задержка для визуализации
        } else {
            log(`Пропущено ребро: ${from} - ${to} (вес: ${edge.weight}) - образует цикл`);
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
                nodes.add({ id: rowIndex.toString(), label: `Узел ${rowIndex}` }); // Без координат
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

            // Запускаем физику для автоматического расположения узлов
            network.setOptions({ physics: { enabled: true } });
            network.stabilize(); // Стабилизация графа

            log("Граф успешно загружен из файла.");
        };
        reader.readAsText(file);
    }
}

// Привязка события загрузки файла
document.getElementById("fileInput").addEventListener("change", loadGraph);
