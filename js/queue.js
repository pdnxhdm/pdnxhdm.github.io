(() => {
  const { $ } = window.QueueLab;
  const capacity = 50;
  let animationFrame = 0;
  let runNumber = 0;

  function poissonForQueue(lambda) {
    if (lambda > 30) {
      let uniformSum = 0;
      for (let index = 0; index < 12; index += 1) {
        uniformSum += Math.random();
      }

      return Math.max(
        0,
        Math.round(lambda + Math.sqrt(lambda) * (uniformSum - 6) / Math.sqrt(12)),
      );
    }

    let product = 1;
    let count = 0;
    const threshold = Math.exp(-lambda);

    do {
      count += 1;
      product *= Math.random();
    } while (product > threshold);

    return count - 1;
  }

  function updateLoadStatus(rho) {
    $("#rhoOut").textContent = rho.toFixed(2);
    $("#qLambdaOut").textContent = (rho * capacity).toFixed(2);

    const stable = rho < 0.8;
    const nearCapacity = rho <= 1;
    $("#loadStatus").textContent = stable
      ? "СТАБИЛЬНАЯ ЗОНА"
      : nearCapacity
        ? "ПОГРАНИЧНАЯ ЗОНА"
        : "ПЕРЕГРУЗКА";
    $("#statusDot").className = `status-dot ${stable ? "stable" : nearCapacity ? "borderline" : "overload"}`;
  }

  function drawQueue(data, visibleCount, criticalLevel, fixedMax) {
    const element = $("#queueChart");
    const ratio = window.devicePixelRatio || 1;
    const bounds = element.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;

    element.width = width * ratio;
    element.height = height * ratio;

    const context = element.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const y = (value) => height - 28 - ((height - 40) * value) / fixedMax;
    context.strokeStyle = "#d7e1ef";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(38, 10);
    context.lineTo(38, height - 28);
    context.lineTo(width - 8, height - 28);
    context.stroke();

    if (visibleCount > 0) {
      context.strokeStyle = "#376ed2";
      context.lineWidth = 2;
      context.beginPath();

      data.slice(0, visibleCount).forEach((value, index) => {
        const x = 38 + ((width - 48) * index) / Math.max(data.length - 1, 1);
        index ? context.lineTo(x, y(value)) : context.moveTo(x, y(value));
      });

      context.stroke();
    }

    context.strokeStyle = "#19a4ad";
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(38, y(criticalLevel));
    context.lineTo(width - 8, y(criticalLevel));
    context.stroke();
    context.setLineDash([]);
  }

  function updateControls() {
    const rho = Number($("#rhoSlider").value);
    const level = Number($("#lSlider").value);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    runNumber += 1;
    updateLoadStatus(rho);
    $("#lOut").textContent = String(level);
    drawQueue([], 0, level, Math.max(5, level));
  }

  function renderMetrics(data, utilization, criticalLevel) {
    const size = data.length;
    $("#peakQ").textContent = data.reduce((maximum, value) => Math.max(maximum, value), 0);
    $("#avgQ").textContent = (
      data.reduce((sum, value) => sum + value, 0) / size
    ).toFixed(2);
    $("#positiveQ").textContent = (
      (data.filter((value) => value > 0).length / size) * 100
    ).toFixed(1) + "%";
    $("#avgUtil").textContent = ((utilization / size) * 100).toFixed(1) + "%";
    $("#aboveL").textContent = (
      (data.filter((value) => value > criticalLevel).length / size) * 100
    ).toFixed(1) + "%";
  }

  function runQueue() {
    const currentRun = ++runNumber;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);

    const rho = Number($("#rhoSlider").value);
    const criticalLevel = Number($("#lSlider").value);
    const size = Number($("#qN").value);
    const arrivalRate = rho * capacity;
    updateLoadStatus(rho);

    const data = [];
    let queue = 0;
    let utilization = 0;
    let peakQueue = 0;

    for (let index = 0; index < size; index += 1) {
      const arrivals = poissonForQueue(arrivalRate);
      const served = Math.min(queue + arrivals, capacity);
      utilization += served / capacity;
      queue = Math.max(0, queue + arrivals - capacity);
      peakQueue = Math.max(peakQueue, queue);
      data.push(queue);
    }

    const fixedMax = Math.max(criticalLevel, peakQueue, 5);
    const element = $("#queueChart");
    const ratio = window.devicePixelRatio || 1;
    const bounds = element.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    const context = element.getContext("2d");
    const y = (value) => height - 28 - ((height - 40) * value) / fixedMax;
    const x = (index) => 38 + ((width - 48) * index) / Math.max(size - 1, 1);

    element.width = width * ratio;
    element.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "#d7e1ef";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(38, 10);
    context.lineTo(38, height - 28);
    context.lineTo(width - 8, height - 28);
    context.stroke();

    let drawnCount = 0;
    const duration = 1200;
    let startTime = 0;

    function drawNextFrame(time) {
      if (currentRun !== runNumber) return;
      if (!startTime) startTime = time;

      const progress = Math.min(1, (time - startTime) / duration);
      const targetCount = Math.max(1, Math.floor(size * progress));

      if (targetCount > drawnCount) {
        context.strokeStyle = "#376ed2";
        context.lineWidth = 2;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        const firstPoint = drawnCount === 0 ? 0 : drawnCount - 1;
        context.moveTo(x(firstPoint), y(data[firstPoint]));

        for (let index = Math.max(1, drawnCount); index < targetCount; index += 1) {
          context.lineTo(x(index), y(data[index]));
        }

        context.stroke();
        drawnCount = targetCount;
      }

      // Redraw the threshold last so it always stays above the queue trace.
        context.strokeStyle = "#19a4ad";
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(38, y(criticalLevel));
      context.lineTo(width - 8, y(criticalLevel));
      context.stroke();
      context.setLineDash([]);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(drawNextFrame);
        return;
      }

      renderMetrics(data, utilization, criticalLevel);
      animationFrame = 0;
    }

    animationFrame = window.requestAnimationFrame(drawNextFrame);
  }

  document.querySelectorAll("#qNButtons button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#qNButtons button").forEach((option) => {
        option.classList.remove("active");
      });

      button.classList.add("active");
      $("#qN").value = button.dataset.n;
    });
  });

  $("#rhoSlider").addEventListener("input", updateControls);
  $("#lSlider").addEventListener("input", updateControls);
  $("#runQueue").addEventListener("click", runQueue);

  updateControls();
  runQueue();
})();
