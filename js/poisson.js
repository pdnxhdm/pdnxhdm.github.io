(() => {
  const { $, format, poisson, setDifference, setupRange } = window.QueueLab;
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

  function generateSample() {
    const lambda = Number($("#lambda").value);
    const size = Number(sampleSize.value);
    const values = Array.from({ length: size }, () => poisson(lambda));
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

    generateButton.classList.add("is-generating");
    generateButton.innerHTML = 'Генерируем выборку <span class="spinner">◌</span>';

    window.setTimeout(() => {
      generateButton.classList.remove("is-generating");
      generateButton.classList.add("is-ready");
      generateButton.innerHTML = "Выборка сгенерирована <span>✓</span>";

      window.setTimeout(() => {
        generateButton.classList.remove("is-ready");
        generateButton.innerHTML = "Сгенерировать поток <span>↗</span>";
      }, 600);
    }, 450);
  }

  generateButton.addEventListener("click", generateSample);
  generateSample();
})();
