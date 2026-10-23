(() => {
  const { $, clearChart, format, poisson, setupRange } =
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

  function drawJointDistribution(points, expectedX, expectedY) {
    const chart = clearChart("dependentChart");
    const { context, width, height } = chart;
    const margin = { top: 18, right: 18, bottom: 42, left: 48 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxX = Math.max(1, Math.ceil(expectedX), ...points.map(([x]) => x));
    const maxY = Math.max(1, Math.ceil(expectedY), ...points.map(([, y]) => y));
    const columns = maxX + 1;
    const rows = maxY + 1;
    const cellWidth = plotWidth / columns;
    const cellHeight = plotHeight / rows;
    const counts = new Map();

    points.forEach(([x, y]) => {
      const key = `${x},${y}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const maxCount = Math.max(...counts.values(), 1);
    const pale = [229, 239, 252];
    const saturated = [48, 103, 190];
    const colorForCount = (count) => {
      const mix = Math.sqrt(count / maxCount);
      const rgb = pale.map((channel, index) =>
        Math.round(channel + (saturated[index] - channel) * mix),
      );
      return `rgb(${rgb.join(",")})`;
    };

    context.fillStyle = "#f8faff";
    context.fillRect(margin.left, margin.top, plotWidth, plotHeight);

    for (let x = 0; x <= maxX; x += 1) {
      for (let y = 0; y <= maxY; y += 1) {
        const count = counts.get(`${x},${y}`) || 0;
        const left = margin.left + x * cellWidth;
        const top = margin.top + (maxY - y) * cellHeight;

        context.fillStyle = count ? colorForCount(count) : "#f0f5fb";
        context.fillRect(left + 1, top + 1, Math.max(0, cellWidth - 2), Math.max(0, cellHeight - 2));

        if (count && cellWidth >= 28 && cellHeight >= 20) {
          context.fillStyle = count / maxCount > 0.45 ? "#fff" : "#294765";
          context.font = "700 10px Nunito, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(String(count), left + cellWidth / 2, top + cellHeight / 2);
        }
      }
    }

    context.strokeStyle = "#b9c9dc";
    context.lineWidth = 1;
    context.strokeRect(margin.left, margin.top, plotWidth, plotHeight);
    context.fillStyle = "#70849d";
    context.font = "600 11px Nunito, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "top";

    const xStep = maxX > 18 ? 4 : maxX > 10 ? 2 : 1;
    const yStep = maxY > 18 ? 4 : maxY > 10 ? 2 : 1;
    for (let x = 0; x <= maxX; x += xStep) {
      const center = margin.left + (x + 0.5) * cellWidth;
      context.fillText(String(x), center, margin.top + plotHeight + 7);
    }

    context.textAlign = "right";
    context.textBaseline = "middle";
    for (let y = 0; y <= maxY; y += yStep) {
      const center = margin.top + (maxY - y + 0.5) * cellHeight;
      context.fillText(String(y), margin.left - 9, center);
    }

    context.fillStyle = "#375879";
    context.font = "800 12px Nunito, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.fillText("X", margin.left + plotWidth / 2, height - 3);
    context.save();
    context.translate(13, margin.top + plotHeight / 2);
    context.rotate(-Math.PI / 2);
    context.textBaseline = "top";
    context.fillText("Y", 0, 0);
    context.restore();

    const meanX = margin.left + (expectedX + 0.5) * cellWidth;
    const meanY = margin.top + (maxY - expectedY + 0.5) * cellHeight;
    context.beginPath();
    context.arc(meanX, meanY, 6, 0, Math.PI * 2);
    context.fillStyle = "#fff";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#19a4ad";
    context.stroke();
    context.beginPath();
    context.arc(meanX, meanY, 2, 0, Math.PI * 2);
    context.fillStyle = "#19a4ad";
    context.fill();
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

    drawJointDistribution(points, theoreticalMeanX, theoreticalMeanY);
  }

  $("#runDependent").addEventListener("click", simulateDependentFlows);
  simulateDependentFlows();
})();
