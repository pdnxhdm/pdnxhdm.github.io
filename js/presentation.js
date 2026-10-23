(() => {
  const summaries = [
    [
      "#poisson .section-head p",
      String.raw`<span class="formula-item">$X_n\sim\mathrm{Pois}(\lambda)$</span><span class="formula-item">$\mathsf E[X_n]=\mathsf D[X_n]=\lambda$</span><span class="formula-item">$\mathsf E[X_n^2]=\lambda+\lambda^2$</span>`,
    ],
    [
      "#queue .section-head p",
      String.raw`<span class="formula-item">$Q_n=\max(0,Q_{n-1}+X_n-c)$</span><span class="formula-item">$\rho=\lambda/c$</span>`,
    ],
    [
      "#dependent .section-head p",
      String.raw`<span class="formula-item">$X=A+C,\quad Y=B+C$</span><span class="formula-item">$\mathsf E[X]=\lambda_A+\lambda_C$</span><span class="formula-item">$\mathsf E[Y]=\lambda_B+\lambda_C$</span><span class="formula-item">$\mathsf D[X]=\lambda_A+\lambda_C$</span><span class="formula-item">$\mathsf D[Y]=\lambda_B+\lambda_C$</span><span class="formula-item">$\mathrm{Cov}(X,Y)=\lambda_C$</span><span class="formula-item">$\mathrm{Corr}(X,Y)=\dfrac{\lambda_C}{\sqrt{(\lambda_A+\lambda_C)(\lambda_B+\lambda_C)}}$</span>`,
    ],
    [
      "#strategy .section-head p",
      String.raw`<span class="formula-item">$c_n=c+\Delta c\,I_n$</span><span class="formula-item">$I_n=\mathbf1\{Q_{n-1}\ge q\}$</span><span class="formula-item">$\gamma=b/a$</span><span class="formula-item">$\overline C_N=\dfrac1N\sum_{n=1}^N(aQ_{n-1}+bI_n)$</span>`,
    ],
  ];

  const targets = [];
  const headings = [
    [".hero h1", "Расчёты<br /><em>случайных потоков.</em>"],
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

    const sectionHead = paragraph.closest(".section-head");
    const sectionId = paragraph.closest(".lab-section")?.id;
    const details = document.createElement("details");
    details.className = `formula-disclosure formula-disclosure-${sectionId}`;
    const trigger = document.createElement("summary");
    trigger.textContent = "Формулы модели";
    details.append(trigger, paragraph);
    sectionHead.append(details);
  });

  const lead = document.querySelector(".hero .lead");
  if (lead) {
    lead.textContent = "Теория и моделирование: сравните формулы с результатами эксперимента.";
  }

  document.querySelector(".hero-grid")?.remove();
  document.querySelector(".hero .text-link")?.remove();

  if (window.MathJax?.typesetPromise && targets.length) {
    window.MathJax.typesetPromise(targets).catch((error) => {
      console.error("Не удалось отобразить формулы:", error);
    });
  }
})();
