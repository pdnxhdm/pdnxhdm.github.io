(() => {
  const summaries = [
    [
      "#poisson .section-head p",
      String.raw`$X_n\sim\mathrm{Pois}(\lambda)$ · $\mathsf E[X_n]=\mathsf D[X_n]=\lambda$ · $\mathsf E[X_n^2]=\lambda+\lambda^2$`,
    ],
    [
      "#queue .section-head p",
      String.raw`$Q_n=\max(0,Q_{n-1}+X_n-c)$ · $\rho=\lambda/c$ · $c=50$`,
    ],
    [
      "#dependent .section-head p",
      String.raw`$X=A+C,\quad Y=B+C$ · $\mathsf E[X]=\lambda_A+\lambda_C$ · $\mathsf E[Y]=\lambda_B+\lambda_C$<br>$\mathsf D[X]=\lambda_A+\lambda_C$ · $\mathsf D[Y]=\lambda_B+\lambda_C$ · $\mathrm{Cov}(X,Y)=\lambda_C$<br>$\mathrm{Corr}(X,Y)=\dfrac{\lambda_C}{\sqrt{(\lambda_A+\lambda_C)(\lambda_B+\lambda_C)}}$`,
    ],
    [
      "#strategy .section-head p",
      String.raw`$c_n=c+\Delta c\,I_n$ · $I_n=\mathbf1\{Q_{n-1}\ge q\}$ · $\gamma=b/a$<br>$\overline C_N=\dfrac1N\sum_{n=1}^N(aQ_{n-1}+bI_n)$`,
    ],
  ];

  const targets = [];
  const headings = [
    [".hero h1", "Расчёты<br /><em>случайных потоков.</em>"],
    ["#theory .intro-copy h2", "Обозначения<br />и модели."],
    ["#poisson .section-head h2", "Распределение<br /><em>Пуассона.</em>"],
    ["#queue .section-head h2", "Динамика<br /><em>очереди.</em>"],
    ["#dependent .section-head h2", "Зависимые<br /><em>потоки.</em>"],
    ["#strategy .section-head h2", "Стратегии<br /><em>управления.</em>"],
  ];
  headings.forEach(([selector, markup]) => {
    const heading = document.querySelector(selector);
    if (heading) heading.innerHTML = markup;
  });

  summaries.forEach(([selector, markup]) => {
    const paragraph = document.querySelector(selector);
    if (!paragraph) return;
    paragraph.classList.add("math-summary");
    paragraph.innerHTML = markup;
    targets.push(paragraph);
  });

  const lead = document.querySelector(".hero .lead");
  if (lead) {
    lead.textContent = "Теория и моделирование: сравните формулы с результатами эксперимента.";
  }

  const intro = document.querySelector("#theory .intro-copy p");
  if (intro) {
    intro.innerHTML =
      String.raw`$X_n$ — заявки за шаг · $Q_n$ — очередь · $\lambda$ — интенсивность · $c$ — мощность`;
    targets.push(intro);
  }

  if (window.MathJax?.typesetPromise && targets.length) {
    window.MathJax.typesetPromise(targets).catch((error) => {
      console.error("Не удалось отобразить формулы:", error);
    });
  }
})();
