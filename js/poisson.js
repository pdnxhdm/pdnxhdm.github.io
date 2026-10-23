(() => {
  const { $, axes, clearChart, format, poisson, setDifference, setupRange } =
    window.QueueLab;
  const sampleSize = $("#sampleN");
  const sampleSizeOutput = $("#nOut");
  const generateButton = $("#runPoisson");

  setupRange("lambda", "lambdaOut", (value) => Number(value).toFixed(1));

  document.querySelectorAll("#nButtons button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#nButtons button").forEach((option) => {
        option.classList.remove("active");
      });

      button.classList.add("active");
      sampleSize.value = button.dataset.n;
      sampleSizeOutput.textContent = button.dataset.n;
    });
  });

  function drawDistribution(values, lambda) {
    const counts = new Map();
    values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

    const observedMax = Math.max(0, ...counts.keys());
    const maxK = Math.max(
      observedMax,
      Math.ceil(lambda + 4 * Math.sqrt(lambda) + 2),
    );
    const empirical = Array.from(
      { length: maxK + 1 },
      (_, k) => (counts.get(k) || 0) / values.length,
    );
    const theoretical = [Math.exp(-lambda)];
    for (let k = 1; k <= maxK; k += 1) {
      theoretical.push((theoretical[k - 1] * lambda) / k);
    }

    const chart = clearChart("poissonChart");
    const maxProbability = Math.max(...empirical, ...theoretical, 0.01) * 1.12;
    const [x, y] = axes(chart, maxK + 1, maxProbability);
    const { context, height } = chart;
    const baseline = height - 28;
    const slotWidth = (chart.width - 48) / (maxK + 1);
    const barWidth = Math.max(1, Math.min(12, slotWidth * 0.34));

    for (let k = 0; k <= maxK; k += 1) {
      const center = x(k + 0.5);
      const empiricalY = y(empirical[k]);
      context.fillStyle = "#376ed2";
      context.fillRect(
        center - barWidth - 1,
        empiricalY,
        barWidth,
        baseline - empiricalY,
      );

      const theoreticalY = y(theoretical[k]);
      context.fillStyle = "#19a4ad";
      context.fillRect(
        center + 1,
        theoreticalY,
        barWidth,
        baseline - theoreticalY,
      );
    }

    axes(chart, maxK + 1, maxProbability);
  }

  function generateSample() {
    const lambda = Number($("#lambda").value);
    const size = Number(sampleSize.value);
    const values = Array.from({ length: size }, () => poisson(lambda));
    drawDistribution(values, lambda);
    const mean = values.reduce((sum, value) => sum + value, 0) / size;
    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / size;
    const secondMoment = variance + mean ** 2;

    $("#theoryMean").textContent = format(lambda);
    $("#empMean").textContent = format(mean);
    $("#theoryVar").textContent = format(lambda);
    $("#empVar").textContent = format(variance);
    $("#theorySecond").textContent = format(lambda ** 2 + lambda);
    $("#empSecond").textContent = format(secondMoment);

    setDifference("diffMean", lambda, mean);
    setDifference("diffVar", lambda, variance);
    setDifference("diffSecond", lambda ** 2 + lambda, secondMoment);

  }

  generateButton.addEventListener("click", generateSample);
  generateSample();
})();
