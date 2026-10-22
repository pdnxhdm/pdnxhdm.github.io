(() => {
  const { $ } = window.QueueLab;
  const capacity = 50;
  let animationTimer = 0;
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
    context.strokeStyle = "#343439";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(38, 10);
    context.lineTo(38, height - 28);
    context.lineTo(width - 8, height - 28);
    context.stroke();

    if (visibleCount > 0) {
      context.strokeStyle = "#ff7545";
      context.lineWidth = 2;
      context.beginPath();

      data.slice(0, visibleCount).forEach((value, index) => {
        const x = 38 + ((width - 48) * index) / Math.max(data.length - 1, 1);
        index ? context.lineTo(x, y(value)) : context.moveTo(x, y(value));
      });

      context.stroke();
    }

    context.strokeStyle = "#85e5ad";
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
    updateLoadStatus(rho);
    drawQueue([], 0, level, Math.max(5, level));
  }

  function renderMetrics(data, utilization, criticalLevel) {
    const size = data.length;
    $("#peakQ").textContent = Math.max(...data);
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
    if (animationTimer) window.clearTimeout(animationTimer);

    const rho = Number($("#rhoSlider").value);
    const criticalLevel = Number($("#lSlider").value);
    const size = Number($("#qN").value);
    const arrivalRate = rho * capacity;
    updateLoadStatus(rho);

    const data = [];
    let queue = 0;
    let utilization = 0;

    for (let index = 0; index < size; index += 1) {
      const arrivals = poissonForQueue(arrivalRate);
      const served = Math.min(queue + arrivals, capacity);
      utilization += served / capacity;
      queue = Math.max(0, queue + arrivals - capacity);
      data.push(queue);
    }

    const fixedMax = Math.max(criticalLevel, ...data, 5);
    const frameSize = Math.max(1, Math.ceil(size / 100));
    let visibleCount = 0;
    drawQueue(data, 0, criticalLevel, fixedMax);

    function drawNextFrame() {
      if (currentRun !== runNumber) return;

      visibleCount = Math.min(size, visibleCount + frameSize);
      drawQueue(data, visibleCount, criticalLevel, fixedMax);

      if (visibleCount < size) {
        animationTimer = window.setTimeout(drawNextFrame, 30);
        return;
      }

      renderMetrics(data, utilization, criticalLevel);
      animationTimer = 0;
    }

    drawNextFrame();
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
