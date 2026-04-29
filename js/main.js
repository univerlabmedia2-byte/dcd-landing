/* ============================================
   DCDcompany Landing Page - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initFloatingCTA();
  initCountUp();
  initSliders();
  initFAQ();
  initContactForm();
  initModal();
});

/* --- Scroll Fade-in Animations --- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach((el) => observer.observe(el));
}

/* --- Floating CTA --- */
function initFloatingCTA() {
  const cta = document.querySelector('.floating-cta');
  const hero = document.querySelector('.hero');
  if (!cta || !hero) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      cta.classList.remove('visible');
    } else {
      cta.classList.add('visible');
    }
  }, { threshold: 0.3 });

  observer.observe(hero);

  // Mobile body class
  if (window.innerWidth <= 768) {
    document.body.classList.add('has-mobile-cta');
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      document.body.classList.add('has-mobile-cta');
    } else {
      document.body.classList.remove('has-mobile-cta');
    }
  });
}

/* --- Count Up Animation --- */
function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((el) => observer.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(target * eased);

    el.textContent = prefix + current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* --- Slider --- */
class Slider {
  constructor(container, options = {}) {
    this.container = container;
    this.track = container.querySelector('.slider-track, .portfolio-track');
    this.slides = container.querySelectorAll('.slide, .portfolio-slide');
    this.prevBtn = container.querySelector('.slider-prev');
    this.nextBtn = container.querySelector('.slider-next');
    this.dotsContainer = container.querySelector('.slider-dots');

    this.currentIndex = 0;
    this.slidesPerView = options.slidesPerView || 1;
    this.autoplay = options.autoplay !== false;
    this.autoplayInterval = options.autoplayInterval || 4000;
    this.autoplayTimer = null;

    if (!this.track || this.slides.length === 0) return;

    this.totalSlides = this.slides.length;
    this.maxIndex = Math.max(0, this.totalSlides - this.slidesPerView);

    this.init();
  }

  init() {
    this.createDots();
    this.bindEvents();
    this.updateSlider();
    if (this.autoplay) this.startAutoplay();
  }

  createDots() {
    if (!this.dotsContainer) return;
    const dotCount = this.maxIndex + 1;
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement('button');
      dot.classList.add('slider-dot');
      dot.setAttribute('aria-label', `슬라이드 ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    }
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    this.container.addEventListener('mouseenter', () => this.stopAutoplay());
    this.container.addEventListener('mouseleave', () => {
      if (this.autoplay) this.startAutoplay();
    });

    // Touch support
    let startX = 0;
    let deltaX = 0;
    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      this.stopAutoplay();
    }, { passive: true });

    this.track.addEventListener('touchmove', (e) => {
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    this.track.addEventListener('touchend', () => {
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) this.next();
        else this.prev();
      }
      deltaX = 0;
      if (this.autoplay) this.startAutoplay();
    });
  }

  prev() {
    this.goTo(this.currentIndex <= 0 ? this.maxIndex : this.currentIndex - 1);
  }

  next() {
    this.goTo(this.currentIndex >= this.maxIndex ? 0 : this.currentIndex + 1);
  }

  goTo(index) {
    this.currentIndex = index;
    this.updateSlider();
  }

  updateSlider() {
    const offset = (this.currentIndex * 100) / this.slidesPerView;
    this.track.style.transform = `translateX(-${offset}%)`;

    const dots = this.dotsContainer?.querySelectorAll('.slider-dot');
    dots?.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentIndex);
    });
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => this.next(), this.autoplayInterval);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}

function initSliders() {
  // Case Studies Slider
  const caseSlider = document.querySelector('.case-studies .slider-container');
  if (caseSlider) {
    new Slider(caseSlider, { slidesPerView: 1, autoplayInterval: 4000 });
  }

  // Portfolio Slider
  const portfolioSlider = document.querySelector('.portfolio .slider-container');
  if (portfolioSlider) {
    const getSlidesPerView = () => {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    };

    let pSlider = new Slider(portfolioSlider, {
      slidesPerView: getSlidesPerView(),
      autoplayInterval: 3500,
    });

    let prevWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      const prevPerView = getPerView(prevWidth);
      const currentPerView = getSlidesPerView();
      if (prevPerView !== currentPerView) {
        pSlider.stopAutoplay();
        pSlider = new Slider(portfolioSlider, {
          slidesPerView: currentPerView,
          autoplayInterval: 3500,
        });
      }
      prevWidth = currentWidth;
    });

    function getPerView(w) {
      if (w <= 768) return 1;
      if (w <= 1024) return 2;
      return 3;
    }
  }
}

/* --- FAQ Accordion --- */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all
      items.forEach((other) => {
        other.classList.remove('active');
        other.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked if was closed
      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* --- Contact Form --- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const phoneInput = form.querySelector('#phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', formatPhoneNumber);
  }

  form.addEventListener('submit', handleFormSubmit);
}

function formatPhoneNumber(e) {
  let value = e.target.value.replace(/[^0-9]/g, '');
  if (value.length > 11) value = value.slice(0, 11);

  if (value.length <= 3) {
    e.target.value = value;
  } else if (value.length <= 7) {
    e.target.value = value.slice(0, 3) + '-' + value.slice(3);
  } else {
    e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const name = form.querySelector('#name').value.trim();
  const phone = form.querySelector('#phone').value.trim();
  const business = form.querySelector('#business').value;
  const region = form.querySelector('#region').value.trim();
  const company = form.querySelector('#company').value.trim();
  const consent = form.querySelector('#consent').checked;

  // Validation
  if (!name) {
    showValidationError('대표자명을 입력해주세요.');
    return;
  }

  const phoneClean = phone.replace(/-/g, '');
  if (!/^01[0-9]{8,9}$/.test(phoneClean)) {
    showValidationError('올바른 연락처를 입력해주세요. (예: 010-1234-5678)');
    return;
  }

  if (!business) {
    showValidationError('업종을 선택해주세요.');
    return;
  }

  if (!consent) {
    showValidationError('개인정보 수집 동의가 필요합니다.');
    return;
  }

  const formData = { name, phone, business, region, company, consent };
  submitForm(formData);
}

function showValidationError(message) {
  const errorEl = document.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 3000);
  }
}

// 폼 데이터 처리 — contact@dcdcompany.com으로 이메일 발송
const CONTACT_EMAIL = 'contact@dcdcompany.com';

const BUSINESS_LABELS = {
  restaurant: '음식점',
  cafe: '카페',
  beauty: '미용실/네일샵',
  hospital: '병원/의원',
  academy: '학원',
  fitness: '피트니스/요가',
  retail: '소매/유통',
  other: '기타'
};

function submitForm(data) {
  const businessLabel = BUSINESS_LABELS[data.business] || data.business;

  const subject = `[몽땅마케팅 상담 신청] ${data.name} 사장님 / ${businessLabel}`;
  const body = `안녕하세요, 몽땅마케팅 무료 상담을 신청합니다.

━━━━━━━━━━━━━━━━━━━━━━
■ 신청 정보
━━━━━━━━━━━━━━━━━━━━━━

▸ 대표자명: ${data.name}
▸ 연락처: ${data.phone}
▸ 업종: ${businessLabel}
▸ 지역: ${data.region || '(미입력)'}
▸ 업체명: ${data.company || '(미입력)'}

▸ 개인정보 수집 동의: ${data.consent ? '동의' : '미동의'}
▸ 신청 일시: ${new Date().toLocaleString('ko-KR')}

━━━━━━━━━━━━━━━━━━━━━━
빠른 회신 부탁드립니다.
감사합니다.
`;

  const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // 사용자의 메일 클라이언트로 이동
  window.location.href = mailtoUrl;

  // 콘솔에도 백업 데이터 로그 (디버깅용)
  console.log('상담 신청 데이터:', data);

  // 약간의 딜레이 후 성공 모달 표시
  setTimeout(() => {
    showModal();
    const form = document.getElementById('contactForm');
    if (form) form.reset();
  }, 600);
}

/* --- Modal --- */
function initModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
}

function showModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.classList.add('active');
}

function hideModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.classList.remove('active');
}
