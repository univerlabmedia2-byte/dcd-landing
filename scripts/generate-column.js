#!/usr/bin/env node
/**
 * AI 칼럼 자동 생성 스크립트
 * - keywords.json에서 미사용 키워드 1개 선택
 * - Claude API로 SEO 최적화 칼럼 작성
 * - column/[slug].html 생성
 * - column/index.html에 카드 추가
 * - sitemap.xml 업데이트
 * - used-keywords.json 갱신
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// === 경로 설정 ===
const ROOT = path.resolve(__dirname, '..');
const KEYWORDS_PATH = path.join(ROOT, 'data', 'keywords.json');
const USED_KEYWORDS_PATH = path.join(ROOT, 'data', 'used-keywords.json');
const TEMPLATE_PATH = path.join(ROOT, 'data', 'column-template.html');
const COLUMN_DIR = path.join(ROOT, 'column');
const COLUMN_INDEX_PATH = path.join(COLUMN_DIR, 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

const SITE_URL = 'https://univerlabmedia2-byte.github.io/dcd-landing';

const CATEGORY_LABELS = {
  'self-employed': '자영업자',
  'professionals': '전문직',
  'trend': '마케팅 트렌드',
  'howto': '실전 가이드',
};

const CATEGORY_ICONS = {
  'self-employed': '🏪',
  'professionals': '⚖️',
  'trend': '📊',
  'howto': '📘',
};

// === 키워드 선택 ===
function pickKeyword() {
  const keywords = JSON.parse(fs.readFileSync(KEYWORDS_PATH, 'utf8'));
  const used = JSON.parse(fs.readFileSync(USED_KEYWORDS_PATH, 'utf8'));
  const usedSet = new Set(used);

  const available = keywords.filter(k => !usedSet.has(k.keyword));

  if (available.length === 0) {
    console.log('⚠️  모든 키워드를 사용했습니다. used-keywords.json을 비우고 다시 시작합니다.');
    fs.writeFileSync(USED_KEYWORDS_PATH, '[]');
    return keywords[Math.floor(Math.random() * keywords.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

// === Claude API 호출 ===
async function generateContent(keywordObj) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const tone = keywordObj.tone === '친근'
    ? '"사장님" 호칭을 사용하고 친근하고 따뜻한 어조로 작성. 어려운 마케팅 용어는 풀어서 설명.'
    : keywordObj.tone === '전문'
    ? '"원장님/대표님" 호칭을 사용하고 전문적이고 신뢰감 있는 어조. 의료법·변호사법 등 컴플라이언스 강조.'
    : '중립적이고 정보성 강한 어조. 마케팅 실무자/관리자 대상.';

  const prompt = `당신은 한국 마케팅 전문 칼럼니스트입니다. 다음 SEO 키워드로 양질의 블로그 칼럼을 작성해주세요.

# 키워드
"${keywordObj.keyword}"

# 카테고리: ${CATEGORY_LABELS[keywordObj.category]}
# 작성 의도: ${keywordObj.intent}
# 톤: ${tone}

# 작성 규칙
1. 분량: 1500~2500자 (한국어 기준)
2. 구조: 도입부 → H2 섹션 3~5개 → 결론
3. 도입부 첫 단락에 핵심 결론 요약 (구글 알고리즘이 선호)
4. H2/H3 위계 명확히, 자연스러운 키워드 배치 (밀도 1~2%)
5. 자영업자/전문직이 실제로 적용할 수 있는 구체적 팁 포함
6. 본문 중간에 몽땅마케팅 서비스를 자연스럽게 1회 언급 (광고적이지 않게)
7. 결론은 행동 유도 (CTA) 포함

# 출력 형식 (반드시 JSON으로만 응답)
\`\`\`json
{
  "title": "SEO에 최적화된 매력적인 제목 (50자 이내)",
  "description": "메타 디스크립션 (150자 이내, 핵심 키워드 포함)",
  "content_html": "<p>도입부...</p><h2>섹션 1</h2><p>...</p><h2>섹션 2</h2>...",
  "tags": ["관련 태그 5개"]
}
\`\`\`

content_html은 다음 HTML 태그만 사용: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>
이미지나 코드 블록은 사용하지 마세요. 모든 한국어 텍스트는 자연스러워야 합니다.`;

  console.log(`🤖 Claude API 호출 중... (키워드: ${keywordObj.keyword})`);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;

  // JSON 추출 (마크다운 코드 블록 안에 있을 수 있음)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

  return JSON.parse(jsonStr);
}

// === 슬러그 생성 ===
function makeSlug(keyword) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = keyword
    .toLowerCase()
    .replace(/[^가-힯ㄱ-ㆎ\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  return `${date}-${slug}`;
}

// === 칼럼 HTML 파일 생성 ===
function writeColumnHtml(slug, data, keywordObj) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const now = new Date();
  const publishedDate = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
  const publishedIso = now.toISOString();
  const canonicalUrl = `${SITE_URL}/column/${slug}.html`;
  const categoryLabel = CATEGORY_LABELS[keywordObj.category];

  const filled = template
    .replace(/\{\{TITLE\}\}/g, escapeHtml(data.title))
    .replace(/\{\{DESCRIPTION\}\}/g, escapeHtml(data.description))
    .replace(/\{\{KEYWORDS\}\}/g, escapeHtml(data.tags.join(', ')))
    .replace(/\{\{PUBLISHED_DATE\}\}/g, publishedDate)
    .replace(/\{\{PUBLISHED_ISO\}\}/g, publishedIso)
    .replace(/\{\{CATEGORY_LABEL\}\}/g, categoryLabel)
    .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
    .replace(/\{\{CONTENT_HTML\}\}/g, data.content_html)
    .replace(/\{\{SLUG\}\}/g, slug);

  const filePath = path.join(COLUMN_DIR, `${slug}.html`);
  fs.writeFileSync(filePath, filled);
  console.log(`✅ 칼럼 파일 생성: ${filePath}`);

  return { filePath, canonicalUrl, publishedDate, publishedIso, categoryLabel };
}

// === 칼럼 목록 페이지에 카드 추가 ===
function updateColumnIndex(slug, data, keywordObj, meta) {
  let html = fs.readFileSync(COLUMN_INDEX_PATH, 'utf8');

  const icon = CATEGORY_ICONS[keywordObj.category];
  const categoryLabel = CATEGORY_LABELS[keywordObj.category];

  const cardHtml = `        <a href="${slug}.html" class="column-card" data-category="${keywordObj.category}">
          <div class="column-thumb">${icon}</div>
          <div class="column-card-body">
            <div class="column-meta">
              <span class="column-category">${categoryLabel}</span>
              <span>·</span>
              <span>${meta.publishedDate}</span>
            </div>
            <h3>${escapeHtml(data.title)}</h3>
            <p>${escapeHtml(data.description)}</p>
            <span class="column-read-more">자세히 보기 →</span>
          </div>
        </a>`;

  // empty state 제거 + 새 카드 추가
  if (html.includes('column-empty')) {
    html = html.replace(
      /<!-- COLUMN_LIST_START -->[\s\S]*?<!-- COLUMN_LIST_END -->/,
      `<!-- COLUMN_LIST_START -->\n${cardHtml}\n        <!-- COLUMN_LIST_END -->`
    );
  } else {
    html = html.replace(
      '<!-- COLUMN_LIST_START -->',
      `<!-- COLUMN_LIST_START -->\n${cardHtml}`
    );
  }

  fs.writeFileSync(COLUMN_INDEX_PATH, html);
  console.log(`✅ 칼럼 목록 업데이트`);
}

// === sitemap.xml 업데이트 ===
function updateSitemap(slug, meta) {
  let xml = fs.readFileSync(SITEMAP_PATH, 'utf8');

  const newEntry = `  <url>
    <loc>${meta.canonicalUrl}</loc>
    <lastmod>${meta.publishedIso.slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

  xml = xml.replace(
    '<!-- COLUMNS_AUTO_INSERT_BEFORE -->',
    `<!-- COLUMNS_AUTO_INSERT_BEFORE -->\n${newEntry}`
  );

  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`✅ sitemap.xml 업데이트`);
}

// === used-keywords.json 갱신 ===
function markKeywordUsed(keyword) {
  const used = JSON.parse(fs.readFileSync(USED_KEYWORDS_PATH, 'utf8'));
  used.push(keyword);
  fs.writeFileSync(USED_KEYWORDS_PATH, JSON.stringify(used, null, 2));
  console.log(`✅ 사용한 키워드 기록`);
}

// === HTML 이스케이프 (메타 태그용) ===
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// === 메인 실행 ===
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 환경 변수가 설정되어 있지 않습니다.');
    process.exit(1);
  }

  const keywordObj = pickKeyword();
  console.log(`📌 선택된 키워드: ${keywordObj.keyword} (${keywordObj.category})`);

  const data = await generateContent(keywordObj);
  console.log(`📝 글 작성 완료: ${data.title}`);

  const slug = makeSlug(keywordObj.keyword);
  const meta = writeColumnHtml(slug, data, keywordObj);
  updateColumnIndex(slug, data, keywordObj, meta);
  updateSitemap(slug, meta);
  markKeywordUsed(keywordObj.keyword);

  console.log(`\n🎉 완료! 새 칼럼 URL: ${meta.canonicalUrl}\n`);
}

main().catch(err => {
  console.error('❌ 에러 발생:', err);
  process.exit(1);
});
