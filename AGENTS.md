# AI Doc Ready 저장소 작업 규칙

이 저장소는 CLI, 규칙·프로파일, 에이전트 스킬과 공개 제품 웹사이트를 함께 관리한다. 보고서 작성용 templates/AGENTS.md와 구분한다.

## 제품과 웹사이트를 함께 변경한다

- CLI 명령·옵션·JSON·오류/종료 코드·API·규칙·프로파일·지원 형식·스킬·설치 방법·의존성·릴리스 버전을 바꾸면, 같은 변경 묶음에서 웹사이트 영향을 검토한다.
- 소개(site/index.html), 매뉴얼(site/manual.html), FAQ(site/faq.json), 보도자료(site/press-release.html) 중 영향을 받는 부분을 갱신한다. FAQ txt와 보도자료 txt는 빌더가 생성하므로 직접 수정하지 않는다.
- docs/site-impact.json을 매 변경 묶음에서 갱신한다. 공개 문서를 수정했으면 updated, 공개 기능에 영향이 없으면 no-public-impact와 구체적인 이유를 기록한다.
- 미출시 기능은 pending-release로 기록하고 docs/site-drafts/에 문서 초안을 준비한다. npm에서 확인되기 전에는 공개 페이지의 현재 기능·명령·지원 범위로 소개하지 않는다.
- site/product.json은 공개 릴리스의 정본이다. version·releaseDate·releaseRef·검증 수치를 함께 확인한다. releaseRef는 실제 npm gitHead와 일치해야 한다. 다운로드와 예시도 해당 릴리스를 기준으로 만든다.
- 새 기능을 단순히 버전 숫자만 바꾸어 홍보하지 않는다. 실제 CLI로 명령을 검증하고 매뉴얼·FAQ·보도자료의 내용과 한계를 함께 확인한다.
- 성능 개선 수치, 고객 인용문, 공식 인증 표현은 확인된 근거가 있을 때만 사용한다. 행안부 원칙과 자체 보완 규칙을 구분하고 원문에 없는 수치·해석을 추가하지 않는다.

## 검증과 릴리스 순서

1. 기능 및 회귀 테스트를 수행하고 웹사이트 영향 기록과 필요한 문서/초안을 작성한다.
2. npm run check:site, npm test, npm run check, npm run check:meta, 회귀 코퍼스와 배포본 검사를 수행한다. 웹 UI가 바뀌면 데스크톱·모바일·복사·FAQ·다운로드를 확인한다.
3. npm 릴리스가 실제 공개된 후 latest 버전 및 gitHead를 확인한다. 해당 값으로 site/product.json과 공개 문서를 갱신한다. 스킬·예제와 실제 CLI 결과의 demo.json을 함께 확인한다.
4. npm run check:site-release로 공개 릴리스를 검증하고, GitHub Pages 배포 및 실제 공개 URL을 확인한다.

푸시·게시의 승인은 사용자와 상위 지침을 따른다. 웹사이트 규칙 자체를 근거로 npm 게시나 외부 메시지를 임의로 수행하지 않는다. 상세 기준은 docs/website-maintenance.md를 읽는다.
