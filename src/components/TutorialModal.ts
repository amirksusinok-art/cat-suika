import { sound } from '../sound';
import { telegram } from '../telegram';

export class TutorialModal {
  public element: HTMLElement;
  private currentStep: number = 1;
  private onComplete: () => void;

  private steps = [
    {
      title: '1. Выбери место падения 🐾',
      desc: 'Веди пальцем или курсором мыши влево и вправо по верхней части коробки, чтобы направить облачко с котиком в нужную точку.',
      icon: '👆',
    },
    {
      title: '2. Сбрось котика вниз 📦',
      desc: 'Отпусти палец или нажми кнопку мыши. Котик мягко полетит вниз, отскочит от стен и устроится в коробке.',
      icon: '🐱',
    },
    {
      title: '3. Объединяй одинаковых кошек 🔄',
      desc: 'Когда два одинаковых котика соприкоснутся, они муркнут и сольются в одного более крупного кота следующего уровня!',
      icon: '✨',
    },
    {
      title: '4. Очки, монеты и рекорды 🏆',
      desc: 'Чем больше котик, тем больше очков и монет! Серии комбо дают множители. За монеты открывай новые породы и темы оформления в магазине!',
      icon: '🪙',
    },
  ];

  constructor(onComplete: () => void) {
    this.onComplete = onComplete;
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="tutorial-modal-card">
        <div class="modal-header">
          <div class="modal-title">Как играть в Cat Suika</div>
          <button class="modal-close-btn">&times;</button>
        </div>

        <div class="tutorial-content-box">
          <div class="tutorial-icon-large">👆</div>
          <div class="tutorial-step-title">Шаг 1</div>
          <div class="tutorial-step-desc">Описание</div>
        </div>

        <div class="tutorial-dots">
          <span class="dot active"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>

        <div class="tutorial-actions">
          <button class="tutorial-next-btn">Далее ➔</button>
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('.modal-close-btn') as HTMLElement;
    closeBtn.addEventListener('click', () => {
      sound.playClick();
      this.finish();
    });

    const nextBtn = this.element.querySelector('.tutorial-next-btn') as HTMLElement;
    nextBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      if (this.currentStep < this.steps.length) {
        this.currentStep++;
        this.renderStep();
      } else {
        this.finish();
      }
    });

    this.renderStep();
  }

  private renderStep() {
    const data = this.steps[this.currentStep - 1];
    const iconEl = this.element.querySelector('.tutorial-icon-large') as HTMLElement;
    const titleEl = this.element.querySelector('.tutorial-step-title') as HTMLElement;
    const descEl = this.element.querySelector('.tutorial-step-desc') as HTMLElement;
    const nextBtn = this.element.querySelector('.tutorial-next-btn') as HTMLElement;

    iconEl.textContent = data.icon;
    titleEl.textContent = data.title;
    descEl.textContent = data.desc;

    if (this.currentStep === this.steps.length) {
      nextBtn.textContent = 'Понятно, погнали! 🎮';
    } else {
      nextBtn.textContent = 'Далее ➔';
    }

    const dots = this.element.querySelectorAll('.tutorial-dots .dot');
    dots.forEach((dot, idx) => {
      if (idx === this.currentStep - 1) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  private finish() {
    this.hide();
    this.onComplete();
  }

  public show() {
    this.currentStep = 1;
    this.renderStep();
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
