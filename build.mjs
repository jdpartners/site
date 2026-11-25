// 정책 문서 생성기. src/<문서>/<버전>.md 한 벌에서 사람이 보는 페이지와 앱이 받는 파일을 함께 만든다.
// 손으로 두 벌을 맞추지 않기 위한 것이다 — 생성물(*.json, index.html)은 직접 고치지 않는다.
//
//   node build.mjs          생성
//   node build.mjs --check  생성 결과가 저장된 파일과 같은지 확인만(다르면 실패)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');

// docType 은 서버의 동의 기록(account_consents.doc_type)과 같은 이름이다.
const DOCS = [
  { dir: 'privacy', docType: 'PRIVACY', nav: '개인정보 처리방침' },
  { dir: 'terms', docType: 'TERMS', nav: '이용약관' },
];
// 서버가 받는 버전 형식(PolicyProperties.VERSION)과 같다. 다르면 앱이 이 파일을 찾지 못한다.
const VERSION = /^[A-Za-z0-9._-]{1,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 맨 위 --- 사이의 "키: 값" 줄만 읽는다. 본문의 작성 메모(HTML 주석)는 어디에도 게시하지 않는다.
function parse(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(file + ': 맨 위에 --- 머리말이 없습니다');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const body = m[2].replace(/<!--[\s\S]*?-->\n*/g, '').trim() + '\n';
  return { meta, body };
}

function load(doc) {
  const dir = join(ROOT, 'src', doc.dir);
  const versions = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
    const name = f.slice(0, -3);
    const { meta, body } = parse(join(dir, f));
    if (!VERSION.test(name)) throw new Error(f + ': 버전은 영문·숫자·._- 20자 이하여야 합니다');
    if (meta.version !== name) throw new Error(f + ': 머리말의 version 이 파일 이름과 다릅니다');
    if (!meta.title) throw new Error(f + ': title 이 없습니다');
    if (meta.effectiveDate && !DATE.test(meta.effectiveDate)) throw new Error(f + ': effectiveDate 는 YYYY-MM-DD 여야 합니다');
    return { version: name, title: meta.title, effectiveDate: meta.effectiveDate || null, body };
  });
  if (versions.length === 0) throw new Error(doc.dir + ': 문서가 없습니다');
  // 1, 2, 10 순서가 되도록 숫자로 견준다(문자열로 견주면 10 이 2 앞에 온다).
  versions.sort((a, b) => a.version.localeCompare(b.version, 'en', { numeric: true }));
  return versions;
}

// 본문 HTML. 조 제목마다 id 를 붙여 목차가 가리키게 하고, 표는 좁은 화면에서 가로로 밀 수 있게 감싼다.
function renderBody(md) {
  let n = 0;
  const toc = [];
  const html = marked.parse(md, { gfm: true })
    .replace(/<h2>([\s\S]*?)<\/h2>/g, (_, text) => {
      n += 1;
      toc.push({ id: 's' + n, text: text.replace(/^(제\d+조|\d+\.)\s*/, '') });
      return '<h2 id="s' + n + '">' + text + '</h2>';
    })
    .replace(/<p>작성 예정<\/p>/g, '<p class="todo">작성 예정</p>')
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>');
  return { html: html.trim(), toc };
}

function page(doc, v, { isLatestPage, latest }) {
  const draft = v.effectiveDate === null;
  const { html, toc } = renderBody(v.body);
  const navLinks = DOCS.map((d) =>
    '    <a href="/' + d.dir + '/"' + (d.dir === doc.dir ? ' aria-current="page"' : '') + '>' + d.nav + '</a>').join('\n');
  const notices = [];
  if (draft) notices.push('<p class="notice">이 문서는 준비 중입니다. 아직 효력이 있는 내용이 아닙니다.</p>');
  if (!isLatestPage && v.version !== latest.version) {
    notices.push('<p class="notice">이전 버전입니다. <a href="/' + doc.dir + '/">최신 문서 보기</a></p>');
  }
  return [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    // 준비 중인 문서와 버전 보관본은 검색에 걸리지 않게 한다. 검색에 나올 것은 시행된 최신본 하나다.
    ...(draft || !isLatestPage ? ['<meta name="robots" content="noindex">'] : []),
    '<title>' + esc(v.title) + ' | JDPartners</title>',
    '<link rel="stylesheet" href="/assets/style.css">',
    '</head>',
    '<body>',
    '<header class="site"><div class="wrap">',
    '  <a class="brand" href="/">JDPartners 정책</a>',
    '  <nav>',
    navLinks,
    '  </nav>',
    '</div></header>',
    '<main><div class="wrap">',
    '<h1>' + esc(v.title) + '</h1>',
    '<p class="meta">버전 ' + esc(v.version) + ' · 시행일: ' + (v.effectiveDate ?? '미정') + '</p>',
    ...notices,
    '',
    '<nav class="toc" aria-label="목차"><strong>목차</strong>',
    '  <ol>',
    ...toc.map((t) => '    <li><a href="#' + t.id + '">' + t.text + '</a></li>'),
    '  </ol>',
    '</nav>',
    '',
    html,
    '</div></main>',
    '<footer class="site"><div class="wrap">',
    '  <!-- TODO: 상호·대표자·사업자등록번호·주소 -->',
    '  개인정보 문의: <a href="mailto:privacy@jdpartners.kr">privacy@jdpartners.kr</a>',
    '</div></footer>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

const outputs = [];
for (const doc of DOCS) {
  const versions = load(doc);
  const latest = versions[versions.length - 1];
  for (const v of versions) {
    // 앱이 받는 파일. 주소는 /<문서>/<버전>.json 이고, 버전은 서버의 GET /api/config 가 알려 준다.
    const json = { docType: doc.docType, version: v.version, title: v.title, effectiveDate: v.effectiveDate, format: 'markdown', body: v.body };
    outputs.push([join(doc.dir, v.version + '.json'), JSON.stringify(json, null, 2) + '\n']);
    outputs.push([join(doc.dir, v.version, 'index.html'), page(doc, v, { isLatestPage: false, latest })]);
  }
  outputs.push([join(doc.dir, 'index.html'), page(doc, latest, { isLatestPage: true, latest })]);
}

let stale = 0;
for (const [rel, content] of outputs) {
  const file = join(ROOT, rel);
  const same = existsSync(file) && readFileSync(file, 'utf8') === content;
  if (CHECK) {
    if (!same) { stale += 1; console.error('다름: ' + rel); }
    continue;
  }
  if (!same) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    console.log('씀: ' + rel);
  }
}
if (CHECK && stale > 0) {
  console.error('생성물이 원본과 다릅니다. node build.mjs 를 실행하세요.');
  process.exit(1);
}
console.log(CHECK ? '확인 완료 — 생성물이 원본과 같습니다.' : '완료');
