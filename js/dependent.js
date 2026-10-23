(() => {
  const { $, axes, clearChart, drawDots, format, poisson, setupRange } =
    window.QueueLab;

  setupRange("lambdaA", "aOut", (value) => Number(value).toFixed(1));
  setupRange("lambdaB", "bOut", (value) => Number(value).toFixed(1));
  setupRange("lambdaC", "cOut", (value) => Number(value).toFixed(1));

  function simulateDependentFlows() {
    const lambdaA = Number($("#lambdaA").value);
    const lambdaB = Number($("#lambdaB").value);
    const lambdaC = Number($("#lambdaC").value);
    const sampleSize = 500;
    const points = [];
    const xValues = [];
    const yValues = [];

    for (let index = 0; index < sampleSize; index += 1) {
      const x = poisson(lambdaA) + poisson(lambdaC);
      const y = poisson(lambdaB) + poisson(lambdaC);
      points.push([x, y]);
      xValues.push(x);
      yValues.push(y);
    }

    const meanX = xValues.reduce((sum, value) => sum + value, 0) / sampleSize;
    const meanY = yValues.reduce((sum, value) => sum + value, 0) / sampleSize;
    const covariance =
      xValues.reduce(
        (sum, value, index) => sum + (value - meanX) * (yValues[index] - meanY),
        0,
      ) / sampleSize;
    const varianceX =
      xValues.reduce((sum, value) => sum + (value - meanX) ** 2, 0) / sampleSize;
    const varianceY =
      yValues.reduce((sum, value) => sum + (value - meanY) ** 2, 0) / sampleSize;
    const correlation = covariance / Math.sqrt(varianceX * varianceY);

    $("#empCov").textContent = format(covariance);
    $("#corr").textContent = format(correlation);

    const chart = clearChart("dependentChart");
    const maxValue = Math.max(...xValues, ...yValues, 8);
    axes(chart, maxValue, maxValue);
    drawDots(chart, points, "#7257ff", maxValue, maxValue);
  }

  $("#runDependent").addEventListener("click", simulateDependentFlows);
  simulateDependentFlows();
})();
