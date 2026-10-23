(() => {
  const { $, axes, clearChart, drawDots, format, poisson, setupRange } =
    window.QueueLab;
  const sampleSize = 500;

  setupRange("lambdaA", "aOut", (value) => Number(value).toFixed(1));
  setupRange("lambdaB", "bOut", (value) => Number(value).toFixed(1));
  setupRange("lambdaC", "cOut", (value) => Number(value).toFixed(1));

  function updateComparison(id, theoretical, empirical) {
    const difference = empirical - theoretical;
    const relativeDifference = theoretical
      ? (Math.abs(difference) / Math.abs(theoretical)) * 100
      : null;
    const output = $(`#diff${id}`);
    const isClose = relativeDifference === null
      ? Math.abs(difference) <= 0.05
      : relativeDifference <= 5;
    const isWarning = relativeDifference === null
      ? Math.abs(difference) <= 0.1
      : relativeDifference <= 10;

    output.textContent = `${format(difference)} (${relativeDifference === null ? "—" : `${format(relativeDifference)}%`})`;
    output.className = `diff ${isClose ? "good" : isWarning ? "warn" : "bad"}`;
  }

  function simulateDependentFlows() {
    const lambdaA = Number($("#lambdaA").value);
    const lambdaB = Number($("#lambdaB").value);
    const lambdaC = Number($("#lambdaC").value);
    const points = [];
    const xValues = [];
    const yValues = [];

    for (let index = 0; index < sampleSize; index += 1) {
      const common = poisson(lambdaC);
      const x = poisson(lambdaA) + common;
      const y = poisson(lambdaB) + common;
      points.push([x, y]);
      xValues.push(x);
      yValues.push(y);
    }

    const meanX = xValues.reduce((sum, value) => sum + value, 0) / sampleSize;
    const meanY = yValues.reduce((sum, value) => sum + value, 0) / sampleSize;
    const varianceX =
      xValues.reduce((sum, value) => sum + (value - meanX) ** 2, 0) /
      sampleSize;
    const varianceY =
      yValues.reduce((sum, value) => sum + (value - meanY) ** 2, 0) /
      sampleSize;
    const covariance =
      xValues.reduce(
        (sum, value, index) =>
          sum + (value - meanX) * (yValues[index] - meanY),
        0,
      ) / sampleSize;
    const correlationDenominator = Math.sqrt(varianceX * varianceY);
    const correlation = correlationDenominator
      ? covariance / correlationDenominator
      : null;

    const theoreticalMeanX = lambdaA + lambdaC;
    const theoreticalMeanY = lambdaB + lambdaC;
    const theoreticalVarianceX = lambdaA + lambdaC;
    const theoreticalVarianceY = lambdaB + lambdaC;
    const theoreticalCorrelationDenominator = Math.sqrt(
      theoreticalVarianceX * theoreticalVarianceY,
    );
    const theoreticalCorrelation = theoreticalCorrelationDenominator
      ? lambdaC / theoreticalCorrelationDenominator
      : null;

    $("#theoryMeanX").textContent = format(theoreticalMeanX);
    $("#empMeanX").textContent = format(meanX);
    $("#theoryMeanY").textContent = format(theoreticalMeanY);
    $("#empMeanY").textContent = format(meanY);
    $("#theoryVarX").textContent = format(theoreticalVarianceX);
    $("#empVarX").textContent = format(varianceX);
    $("#theoryVarY").textContent = format(theoreticalVarianceY);
    $("#empVarY").textContent = format(varianceY);
    $("#theoryCov").textContent = format(lambdaC);
    $("#empCov").textContent = format(covariance);
    $("#theoryCorr").textContent = theoreticalCorrelation === null
      ? "—"
      : format(theoreticalCorrelation);
    $("#corr").textContent = correlation === null ? "—" : format(correlation);

    updateComparison("MeanX", theoreticalMeanX, meanX);
    updateComparison("MeanY", theoreticalMeanY, meanY);
    updateComparison("VarX", theoreticalVarianceX, varianceX);
    updateComparison("VarY", theoreticalVarianceY, varianceY);
    updateComparison("Cov", lambdaC, covariance);
    if (theoreticalCorrelation === null || correlation === null) {
      $("#diffCorr").textContent = "—";
      $("#diffCorr").className = "diff";
    } else {
      updateComparison("Corr", theoreticalCorrelation, correlation);
    }

    const chart = clearChart("dependentChart");
    const maxValue = Math.max(...xValues, ...yValues, 8);
    axes(chart, maxValue, maxValue);
    drawDots(chart, points, "#7257ff", maxValue, maxValue);
  }

  $("#runDependent").addEventListener("click", simulateDependentFlows);
  simulateDependentFlows();
})();
