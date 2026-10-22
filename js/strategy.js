(() => {
  const { $ } = window.QueueLab;
  const sampleSize = 10000;
  const arrivalRate = 20;
  const baseCapacity = 20;
  const extraCapacity = 10;
  const waitingCost = 5;

  function poisson(lambda) {
    let product = 1;
    let count = 0;
    const threshold = Math.exp(-lambda);

    do {
      count += 1;
      product *= Math.random();
    } while (product > threshold);

    return count - 1;
  }

  function simulateStrategy(arrivals, strategy, threshold, criticalLevel, channelCost) {
    let queue = 0;
    let totalCost = 0;
    let maximumQueue = 0;
    let positiveQueueCount = 0;
    let aboveCriticalCount = 0;
    let extraChannelCount = 0;
    const queues = [];

    for (const incoming of arrivals) {
      const useExtraChannel =
        strategy === "S2" || (strategy === "S3" && queue >= threshold);
      const capacity = baseCapacity + (useExtraChannel ? extraCapacity : 0);

      extraChannelCount += useExtraChannel ? 1 : 0;
      totalCost += waitingCost * queue + channelCost * (useExtraChannel ? 1 : 0);

      queue = Math.max(0, queue + incoming - capacity);
      queues.push(queue);
      maximumQueue = Math.max(maximumQueue, queue);
      positiveQueueCount += queue > 0 ? 1 : 0;
      aboveCriticalCount += queue > criticalLevel ? 1 : 0;
    }

    return {
      queues,
      meanCost: totalCost / sampleSize,
      meanQueue: queues.reduce((sum, value) => sum + value, 0) / sampleSize,
      maximumQueue,
      positiveQueueShare: positiveQueueCount / sampleSize,
      aboveCriticalShare: aboveCriticalCount / sampleSize,
      extraChannelShare: extraChannelCount / sampleSize,
    };
  }

  function drawQueueChart(canvasId, queues, criticalLevel) {
    const canvas = $(`#${canvasId}`);
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(bounds.width, 420);
    const height = Math.max(bounds.height, 260);
    const context = canvas.getContext("2d");
    const left = 38;
    const right = 12;
    const top = 14;
    const bottom = 28;
    const maxQueue = Math.max(criticalLevel, ...queues, 5) * 1.12;
    const x = (index) =>
      left + ((width - left - right) * index) / (queues.length - 1);
    const y = (value) =>
      height - bottom - ((height - top - bottom) * value) / maxQueue;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const drawFrame = (progress) => {
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "#414149";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(left, top);
      context.lineTo(left, height - bottom);
      context.lineTo(width - right, height - bottom);
      context.stroke();

      const visibleCount = Math.max(2, Math.floor(queues.length * progress));
      context.strokeStyle = "#ff7545";
      context.lineWidth = 1.7;
      context.beginPath();

      for (let index = 0; index < visibleCount; index += 1) {
        index
          ? context.lineTo(x(index), y(queues[index]))
          : context.moveTo(x(index), y(queues[index]));
      }

      context.stroke();

      context.setLineDash([6, 5]);
      context.strokeStyle = "#85e5ad";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(left, y(criticalLevel));
      context.lineTo(width - right, y(criticalLevel));
      context.stroke();
      context.setLineDash([]);
    };

    const startTime = performance.now();

    function animate(time) {
      const progress = Math.min(1, (time - startTime) / 1800);
      drawFrame(progress);
      if (progress < 1) window.requestAnimationFrame(animate);
    }

    window.requestAnimationFrame(animate);
  }

  function drawOptimalThreshold(arrivals, criticalLevel) {
    const canvas = $("#strategyOptimalChart");
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(bounds.width, 420);
    const height = Math.max(bounds.height, 260);
    const context = canvas.getContext("2d");
    const points = [];

    for (let gamma = 0.1; gamma <= 50.001; gamma += 2.5) {
      const channelCost = gamma * waitingCost;
      let best = {
        threshold: 0,
        result: simulateStrategy(
          arrivals,
          "S1",
          0,
          criticalLevel,
          channelCost,
        ),
      };

      for (let threshold = 0; threshold <= 80; threshold += 1) {
        const result = simulateStrategy(
          arrivals,
          "S3",
          threshold,
          criticalLevel,
          channelCost,
        );

        if (result.meanCost < best.result.meanCost) {
          best = { threshold, result };
        }
      }

      points.push([gamma, best.threshold]);
    }

    const left = 42;
    const right = 14;
    const top = 14;
    const bottom = 30;
    const maxY = Math.max(10, ...points.map((point) => point[1])) * 1.15;
    const x = (value) => left + ((width - left - right) * value) / 50;
    const y = (value) =>
      height - bottom - ((height - top - bottom) * value) / maxY;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    context.strokeStyle = "#414149";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left, height - bottom);
    context.lineTo(width - right, height - bottom);
    context.stroke();

    context.strokeStyle = "#ff7545";
    context.lineWidth = 2;
    context.beginPath();
    points.forEach(([gamma, threshold], index) => {
      index
        ? context.lineTo(x(gamma), y(threshold))
        : context.moveTo(x(gamma), y(threshold));
    });
    context.stroke();
  }

  function renderMetrics(elementId, result) {
    $(elementId).innerHTML = [
      ["C̄N", result.meanCost.toFixed(2)],
      ["Q̄", result.meanQueue.toFixed(2)],
      ["Qmax", result.maximumQueue],
      ["P(Q>0)", `${(result.positiveQueueShare * 100).toFixed(1)}%`],
      ["P(Q>L)", `${(result.aboveCriticalShare * 100).toFixed(1)}%`],
      ["P(I=1)", `${(result.extraChannelShare * 100).toFixed(1)}%`],
    ]
      .map(
        ([label, value]) =>
          `<div><span>${label}</span><strong>${value}</strong></div>`,
      )
      .join("");
  }

  function renderComparison(rows) {
    const minimumCost = Math.min(...rows.map((row) => row.result.meanCost));
    const tableRows = rows
      .map(({ label, rule, result }) => {
        const isBest = Math.abs(result.meanCost - minimumCost) < 1e-9;

        return `
          <tr class="${isBest ? "best" : ""}">
            <td>${label}</td>
            <td>${rule}</td>
            <td>${result.meanCost.toFixed(2)}</td>
            <td>${result.meanQueue.toFixed(2)}</td>
            <td>${result.maximumQueue}</td>
            <td>${(result.positiveQueueShare * 100).toFixed(1)}%</td>
            <td>${(result.aboveCriticalShare * 100).toFixed(1)}%</td>
            <td>${(result.extraChannelShare * 100).toFixed(1)}%</td>
          </tr>`;
      })
      .join("");

    $("#strategyTable").innerHTML = `
      <table>
        <thead>
          <tr>
            <th>СТРАТЕГИЯ</th>
            <th>ПРАВИЛО</th>
            <th>C̄N</th>
            <th>Q̄</th>
            <th>Qmax</th>
            <th>P(Q&gt;0)</th>
            <th>P(Q&gt;L)</th>
            <th>P(I=1)</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>`;
  }

  function runStrategyStudy() {
    const gamma = Number($("#gammaSlider").value);
    const channelCost = gamma * waitingCost;
    const criticalLevel = Number($("#strategyL").value);
    const arrivals = Array.from({ length: sampleSize }, () =>
      poisson(arrivalRate),
    );
    const strategy1 = simulateStrategy(
      arrivals,
      "S1",
      0,
      criticalLevel,
      channelCost,
    );
    const strategy2 = simulateStrategy(
      arrivals,
      "S2",
      0,
      criticalLevel,
      channelCost,
    );

    let bestThresholdResult = null;
    const maxThreshold = Math.max(
      30,
      Math.min(200, Math.max(strategy1.maximumQueue, strategy2.maximumQueue) + 20),
    );

    for (let threshold = 0; threshold <= maxThreshold; threshold += 1) {
      const result = simulateStrategy(
        arrivals,
        "S3",
        threshold,
        criticalLevel,
        channelCost,
      );

      if (!bestThresholdResult || result.meanCost < bestThresholdResult.result.meanCost) {
        bestThresholdResult = { threshold, result };
      }
    }

    $("#gammaOut").textContent = gamma.toFixed(2);
    $("#bValue").textContent = channelCost.toFixed(2);
    $("#strategyLOut").textContent = String(criticalLevel);
    $("#bestQ").textContent = `q* = ${bestThresholdResult.threshold}`;

    const strategies = [
      {
        label: "S1",
        rule: "канал выключен",
        result: strategy1,
        chart: "strategyChartS1",
        metrics: "#strategyMetricsS1",
      },
      {
        label: "S2",
        rule: "включён всегда",
        result: strategy2,
        chart: "strategyChartS2",
        metrics: "#strategyMetricsS2",
      },
      {
        label: "S3(q*)",
        rule: `Q ≥ ${bestThresholdResult.threshold}`,
        result: bestThresholdResult.result,
        chart: "strategyChartS3",
        metrics: "#strategyMetricsS3",
      },
    ];

    renderComparison(strategies);

    strategies.forEach((strategy) => {
      drawQueueChart(strategy.chart, strategy.result.queues, criticalLevel);
      renderMetrics(strategy.metrics, strategy.result);
    });

    drawOptimalThreshold(arrivals, criticalLevel);
  }

  $("#runStrategy").addEventListener("click", runStrategyStudy);
  $("#gammaSlider").addEventListener("input", () => {
    const gamma = Number($("#gammaSlider").value);
    $("#gammaOut").textContent = gamma.toFixed(2);
    $("#bValue").textContent = (gamma * waitingCost).toFixed(2);
  });
  $("#strategyL").addEventListener("input", () => {
    $("#strategyLOut").textContent = $("#strategyL").value;
  });

  runStrategyStudy();
})();
