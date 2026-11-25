# JDPartners 정책 문서

`policy.jdpartners.kr` 로 공개되는 정적 페이지(GitHub Pages, main 브랜치 그대로 게시).

글의 원본은 `src/` 의 마크다운 한 벌이다. 사람이 보는 페이지와 앱이 받는 파일을 `build.mjs` 가 그 원본에서 함께 만든다.
**생성물(`*.json`, `terms/`·`privacy/` 아래 `index.html`)은 손으로 고치지 않는다** — 고치면 화면의 글과 앱의 글이 갈린다.

| 주소 | 원본 | 용도 |
|---|---|---|
| `/terms/`, `/privacy/` | 가장 높은 버전 | 최신 문서(스토어·앱에 적는 고정 주소) |
| `/terms/1/`, `/privacy/1/` | `src/<문서>/1.md` | 그 버전의 보관본 |
| `/terms/1.json`, `/privacy/1.json` | 같은 파일 | 앱이 가입 화면에 그릴 원문 |
| `/`, `404.html`, `assets/` | 직접 편집 | 문서 목록·공용 스타일 |

## 버전
- 버전은 **서버와 같은 번호**다(`1`, `2` …). 서버는 `GET /api/config` 로 지금 유효한 버전을 알려 주고, 가입한 사람이 동의한 버전을 기록한다.
- 앱은 그 번호로 `/<문서>/<버전>.json` 을 받아 보여 준다. 그래서 **번호와 글이 한 쌍**이어야 한다.
- json 은 `{docType, version, title, effectiveDate, format, body}`. `body` 는 마크다운이고 `effectiveDate` 가 `null` 이면 준비 중인 문서다.

## 고치는 법
```bash
npm install          # 처음 한 번
node build.mjs       # src 를 고친 뒤 실행 → 생성물 갱신
node build.mjs --check   # 생성물이 원본과 같은지 확인
```
- `src/<문서>/<버전>.md` 의 `작성 예정` 을 본문으로 바꾼다. 조 제목은 `## ` 로 시작한다(목차가 여기서 만들어진다).
- `<!-- 작성 메모 … -->` 는 쓰는 사람을 위한 안내이고 **어디에도 게시되지 않는다**. 약관 제11조의 메모는 법정 기재사항 목록이니 본문을 다 쓴 뒤 하나씩 대조한다.
- 원본과 생성물을 **같은 커밋에** 올린다.
- 하단 사업자 정보(`TODO`)는 `build.mjs` 의 바닥글과 `index.html`·`404.html` 에 있다.

## 시행할 때
1. 머리말의 `effectiveDate:` 에 `YYYY-MM-DD` 를 적고 빌드한다. "준비 중" 안내와 검색 차단이 함께 사라진다.
2. `index.html`·`404.html` 의 `<meta name="robots" content="noindex">` 줄을 지운다.
3. **시행일을 적은 버전은 그 뒤로 한 글자도 고치지 않는다** — 그 버전에 동의한 사람이 본 글이다. 오타도 다음 버전에서 고친다.

## 개정할 때
1. `src/<문서>/2.md` 를 새로 만든다(앞 버전을 복사해 `version: 2`, 새 시행일). 개정 이력 조에 바뀐 내용을 적는다.
2. 빌드하고 올린다. `/<문서>/2.json` 이 열리는지 확인한다.
3. **그다음에** 서버의 `POLICY_TERMS_VERSION`·`POLICY_PRIVACY_VERSION` 을 올린다.
   순서가 바뀌면 앱이 없는 파일을 찾아 가입이 막힌다.
