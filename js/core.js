(() => {
  const $ = (selector) => document.querySelector(selector);
  const format = (value) => Number(value).toFixed(2);
  const random = () => Math.random();

  function poisson(lambda) {
    let product = 1;
    let count = 0;
    const threshold = Math.exp(-lambda);

    do {
      count += 1;
      product *= random();
    } while (product > threshold);

    return count - 1;
  }

  function setupRange(inputId, outputId, formatValue = (value) => value) {
    const input = $(`#${inputId}`);
    const output = $(`#${outputId}`);
    if (!input || !output) return;

    const update = () => {
      output.textContent = formatValue(input.value);
    };

    input.addEventListener("input", update);
    update();
  }

  function canvas(id) {
    const element = $(`#${id}`);
    const ratio = window.devicePixelRatio || 1;
    const bounds = element.getBoundingClientRect();

    element.width = bounds.width * ratio;
    element.height = bounds.height * ratio;

    const context = element.getContext("2d");
    context.scale(ratio, ratio);

    return { context, width: bounds.width, height: bounds.height };
  }

  function clearChart(id) {
    const chart = canvas(id);
    chart.context.clearRect(0, 0, chart.width, chart.height);
    return chart;
  }

  function axes(chart, maxX, maxY) {
    const { context, width, height } = chart;
    context.strokeStyle = getComputedStyle(document.body).getPropertyValue("--line");
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(38, 10);
    context.lineTo(38, height - 28);
    context.lineTo(width - 8, height - 28);
    context.stroke();

    return [
      (value) => 38 + ((width - 48) * value) / maxX,
      (value) => height - 28 - ((height - 40) * value) / maxY,
    ];
  }

  function drawLine(chart, values, color, maxY) {
    const { context, width, height } = chart;
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();

    values.forEach((value, index) => {
      const x = 38 + ((width - 48) * index) / (values.length - 1);
      const y = height - 28 - ((height - 40) * value) / maxY;
      index ? context.lineTo(x, y) : context.moveTo(x, y);
    });

    context.stroke();
  }

  function drawDots(chart, points, color, maxX, maxY) {
    const { context, width, height } = chart;
    context.fillStyle = color;

    points.forEach(([xValue, yValue]) => {
      context.beginPath();
      context.arc(
        38 + ((width - 48) * xValue) / maxX,
        height - 28 - ((height - 40) * yValue) / maxY,
        2.2,
        0,
        7,
      );
      context.fill();
    });
  }

  function setDifference(id, theoretical, empirical) {
    const percentage = theoretical
      ? (Math.abs(empirical - theoretical) / Math.abs(theoretical)) * 100
      : 0;
    const output = $(`#${id}`);
    output.textContent = `${format(empirical - theoretical)} (${format(percentage)}%)`;
    output.className = `diff ${percentage <= 5 ? "good" : percentage <= 10 ? "warn" : "bad"}`;
  }

  window.QueueLab = Object.freeze({
    $,
    axes,
    clearChart,
    drawDots,
    drawLine,
    format,
    poisson,
    setDifference,
    setupRange,
  });
})();
