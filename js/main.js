/* ============================================
   DCDcompany Landing Page - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initFloatingCTA();
  initCountUp();
  initSliders();
  initFAQ();
  initContactForm();
  initModal();
});

/* --- Global Navigation --- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navbarToggle');
  const menu = document.getElementById('navbarMenu');

  if (!navbar) return;

  // 스크롤 시 배경 변화
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 모바일 햄버거 토글
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });

    menu.querySelectorAll('.navbar-link').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
      });
    });
  }
}

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
  const get = (sel) => {
    const el = form.querySelector(sel);
    return el ? (el.type === 'checkbox' ? el.checked : el.value.trim ? el.value.trim() : el.value) : '';
  };

  const name = get('#name');
  const phone = get('#phone');
  const company = get('#company');
  const business = get('#business');
  const region = get('#region');
  const years = get('#years');           // 운영 기간 (서브페이지)
  const staff = get('#staff');           // 직원 수 (서브페이지)
  const current = get('#current');       // 현재 마케팅 진행 여부 (서브페이지)
  const budget = get('#budget');
  const concern = get('#concern');
  const methodEl = form.querySelector('input[name="method"]:checked');
  const method = methodEl ? methodEl.value : '';
  const consent = form.querySelector('#consent').checked;

  // Validation - 모든 필드 필수
  if (!name) return showValidationError('대표자명을 입력해주세요.');

  const phoneClean = phone.replace(/-/g, '');
  if (!/^01[0-9]{8,9}$/.test(phoneClean)) {
    return showValidationError('올바른 연락처를 입력해주세요. (예: 010-1234-5678)');
  }

  if (!company) return showValidationError('업체명/사무소명을 입력해주세요.');
  if (!business) return showValidationError('업종/분야를 선택해주세요.');
  if (!region) return showValidationError('지역을 입력해주세요.');

  // 서브페이지에만 있는 필드 — 존재할 때만 검증
  if (form.querySelector('#years') && !years) return showValidationError('운영 기간을 선택해주세요.');
  if (form.querySelector('#staff') && !staff) return showValidationError('직원 수를 선택해주세요.');

  if (!budget) return showValidationError('월 마케팅 예산을 선택해주세요.');

  if (form.querySelector('#current') && !current) return showValidationError('현재 마케팅 진행 여부를 선택해주세요.');

  if (!concern) return showValidationError('가장 시급한 고민을 선택해주세요.');
  if (!method) return showValidationError('희망 상담 방식을 선택해주세요.');
  if (!consent) return showValidationError('개인정보 수집 동의가 필요합니다.');

  const formData = { name, phone, company, business, region, years, staff, current, budget, concern, method, consent };
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
  return false;
}

// 폼 데이터 처리 — contact@dcdcompany.com으로 이메일 발송
const CONTACT_EMAIL = 'contact@dcdcompany.com';

const BUSINESS_LABELS = {
  // 음식점
  'food-korean': '한식 음식점',
  'food-western': '양식/이탈리안',
  'food-japanese': '일식 음식점',
  'food-chinese': '중식 음식점',
  'food-snack': '분식/김밥',
  'food-chicken': '치킨/피자',
  'food-meat': '고깃집/삼겹살',
  'food-pub': '주점/포차',
  'food-other': '기타 음식점',
  // 카페/디저트
  'cafe-general': '카페',
  'cafe-dessert': '디저트 카페',
  'cafe-bakery': '베이커리',
  'cafe-study': '스터디카페',
  'cafe-brunch': '브런치 카페',
  // 미용/뷰티
  'beauty-hair': '미용실',
  'beauty-nail': '네일샵',
  'beauty-skin': '피부관리실',
  'beauty-eyelash': '속눈썹/왁싱',
  'beauty-massage': '마사지/스파',
  // 피트니스/건강
  'fit-gym': '헬스장/피트니스',
  'fit-pt': 'PT 스튜디오',
  'fit-pilates': '필라테스',
  'fit-yoga': '요가',
  'fit-crossfit': '크로스핏/복싱',
  'fit-golf': '실내 골프',
  // 학원/교육
  'edu-entrance': '입시 학원',
  'edu-language': '어학 학원',
  'edu-art': '예체능 학원',
  'edu-kids': '유아/아동 교육',
  'edu-coding': '코딩/IT 학원',
  'edu-academy': '학원/교육',
  // 소매/리테일
  'retail-fashion': '의류 매장',
  'retail-goods': '잡화/생활용품',
  'retail-flower': '꽃집',
  'retail-pet': '펫샵',
  'retail-furniture': '인테리어/가구',
  // 서비스
  'svc-studio': '스튜디오 (사진/영상)',
  'svc-car': '자동차 정비/세차',
  'svc-cleaning': '청소/세탁',
  'svc-repair': '수리/리모델링',
  'svc-other': '기타 서비스',
  // 의료 — 일반과
  'med-internal': '내과',
  'med-surgery': '외과',
  'med-orthopedic': '정형외과',
  'med-neurosurgery': '신경외과',
  'med-obgyn': '산부인과',
  'med-pediatric': '소아청소년과',
  'med-family': '가정의학과',
  // 의료 — 전문 진료과
  'med-dermatology': '피부과',
  'med-plastic': '성형외과',
  'med-ophthalmology': '안과',
  'med-ent': '이비인후과',
  'med-urology': '비뇨기과',
  'med-rehab': '재활의학과',
  'med-psychiatry': '정신건강의학과',
  // 의료 — 치과/한방
  'med-dental': '치과 (일반)',
  'med-dental-ortho': '치과 (교정/임플란트)',
  'med-oriental': '한의원',
  // 의료 — 기타
  'med-vet': '동물병원',
  'med-pharmacy': '약국',
  'med-other': '기타 의료기관',
  // 법률/세무/회계
  'law-attorney': '변호사 (개업)',
  'law-firm': '법무법인',
  'law-tax': '세무사',
  'law-cpa': '공인회계사 (CPA)',
  'law-labor': '노무사',
  'law-patent': '변리사',
  'law-broker': '공인중개사',
  'law-admin': '행정사',
  'law-claim': '손해사정사',
  'law-other': '기타 전문직',
  // 기타 전문직
  'pro-consult': '경영 컨설턴트',
  'pro-architect': '건축사',
  'pro-academy': '학원/교육원',
  'pro-other': '기타 전문직',
  'other': '기타',
  // Legacy 호환
  restaurant: '음식점',
  cafe: '카페',
  beauty: '미용실/네일샵',
  hospital: '병원/의원',
  academy: '학원',
  fitness: '피트니스/요가',
  retail: '소매/유통',
  profession: '전문직'
};

const BUDGET_LABELS = {
  'under-30': '월 30만원 이하',
  '30-50': '월 30~50만원',
  '50-100': '월 50~100만원',
  'under-100': '월 100만원 이하',
  '100-300': '월 100~300만원',
  '300-500': '월 300~500만원',
  '500-1000': '월 500~1,000만원',
  'over-300': '월 300만원 이상',
  'over-1000': '월 1,000만원 이상',
  'undecided': '상담 후 결정'
};

const YEARS_LABELS = {
  'under-1': '1년 미만',
  '1-3': '1~3년',
  '3-5': '3~5년',
  '5-10': '5~10년',
  'over-10': '10년 이상'
};

const STAFF_LABELS = {
  'solo': '대표 1인',
  '2-3': '2~3명',
  '2-5': '2~5명',
  '4-7': '4~7명',
  '6-10': '6~10명',
  '8-15': '8~15명',
  '11-30': '11~30명',
  'over-15': '16명 이상',
  'over-30': '31명 이상'
};

const CURRENT_LABELS = {
  'none': '전혀 진행하지 않고 있음',
  'self': '대표/직원이 직접 운영 중',
  'other-agency': '다른 마케팅 업체 이용 중',
  'part-time': '아르바이트/프리랜서 활용',
  'other': '기타'
};

const CONCERN_LABELS = {
  sales: '매출이 떨어지고 있어요',
  newcustomers: '신규 고객 유입이 부족해요',
  reviews: '리뷰 관리가 어려워요',
  sns: 'SNS 운영을 못 하고 있어요',
  ads: '광고비 효과를 모르겠어요',
  branding: '브랜드를 키우고 싶어요',
  competition: '주변 경쟁이 심해졌어요',
  repeat: '단골/재방문이 적어요',
  delivery: '배달앱 노출이 안 돼요',
  homepage: '홈페이지 신규 제작/리뉴얼',
  blog: '블로그 운영 어려움',
  compliance: '의료/광고법 컴플라이언스 우려',
  other: '기타 (상담 시 설명)'
};

const METHOD_LABELS = {
  phone: '📞 전화 상담',
  visit: '🚗 방문 상담',
  video: '💻 화상 상담'
};

function submitForm(data) {
  const businessLabel = BUSINESS_LABELS[data.business] || data.business;
  const budgetLabel = BUDGET_LABELS[data.budget] || data.budget;
  const concernLabel = CONCERN_LABELS[data.concern] || data.concern;
  const methodLabel = METHOD_LABELS[data.method] || data.method;
  const yearsLabel = data.years ? (YEARS_LABELS[data.years] || data.years) : '';
  const staffLabel = data.staff ? (STAFF_LABELS[data.staff] || data.staff) : '';
  const currentLabel = data.current ? (CURRENT_LABELS[data.current] || data.current) : '';

  const subject = `[몽땅마케팅 상담 신청] ${data.name} / ${businessLabel} / ${data.region}`;

  // 서브페이지 추가 필드 섹션 (있을 때만 추가)
  const operationsSection = (yearsLabel || staffLabel || currentLabel)
    ? `\n━━━━━━━━━━━━━━━━━━━━━━\n■ 운영 현황\n━━━━━━━━━━━━━━━━━━━━━━${yearsLabel ? `\n▸ 운영 기간: ${yearsLabel}` : ''}${staffLabel ? `\n▸ 직원 규모: ${staffLabel}` : ''}${currentLabel ? `\n▸ 현재 마케팅: ${currentLabel}` : ''}\n`
    : '';

  const body = `안녕하세요, 몽땅마케팅 무료 상담을 신청합니다.

━━━━━━━━━━━━━━━━━━━━━━
■ 기본 정보
━━━━━━━━━━━━━━━━━━━━━━
▸ 대표자명: ${data.name}
▸ 연락처: ${data.phone}
▸ 업체명/사무소명: ${data.company}
▸ 업종/분야: ${businessLabel}
▸ 지역: ${data.region}
${operationsSection}
━━━━━━━━━━━━━━━━━━━━━━
■ 상담 정보
━━━━━━━━━━━━━━━━━━━━━━
▸ 월 마케팅 예산: ${budgetLabel}
▸ 가장 시급한 고민: ${concernLabel}
▸ 희망 상담 방식: ${methodLabel}

━━━━━━━━━━━━━━━━━━━━━━
■ 동의 정보
━━━━━━━━━━━━━━━━━━━━━━
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
