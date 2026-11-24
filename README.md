# JDPartners 정책 문서

`policy.jdpartners.kr` 로 공개되는 정적 페이지(GitHub Pages). 빌드 과정 없이 HTML 을 그대로 올린다.

| 주소 | 파일 |
|---|---|
| `/` | `index.html` (문서 목록) |
| `/privacy` | `privacy/index.html` (최신 개인정보 처리방침) |
| `/terms` | `terms/index.html` (최신 이용약관) |

## 내용을 채울 때
- 각 절의 `작성 예정` 문단을 본문으로 바꾼다. 표는 `<div class="table-scroll"><table>…</table></div>` 로 감싼다(모바일 가로 스크롤).
- 하단 사업자 정보(`TODO`)를 모든 페이지에서 채운다.

## 시행(공개)할 때
1. 시행일을 `YYYY-MM-DD` 로 적고 "준비 중" 안내 문단을 지운다.
2. `<meta name="robots" content="noindex">` 줄을 지운다.
3. 그 시점의 문서를 `privacy/YYYY-MM-DD/index.html` 로 복사해 보관본을 만든다(복사본의 `../` 경로는 `../../` 로). 약관도 같다.

## 개정할 때
- 최신본(`privacy/index.html`)을 고치고, 새 시행일 폴더에 보관본을 하나 더 만든다. **이미 공개한 날짜 폴더는 고치지 않는다** — 그 날짜에 동의한 사람이 본 문서다.
- 개정 이력 절에 날짜별 보관본 링크를 추가한다.
