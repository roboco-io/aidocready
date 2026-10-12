# GitHub Pages 제품 사이트

소개, 사용 매뉴얼, 고객·제품 전략 FAQ와 Press release를 제공합니다. GitHub Pages에 공개하며 조직의 기존 Pages 도메인인 `https://roboco.io/aidocready/`를 사용합니다.

`node scripts/build-site.mjs`로 `_site/`를 만들고 내부 문서·앵커·다운로드 링크를 검증합니다. Pages 워크플로는 main의 사이트 변경을 배포합니다. 별도 npm 설치나 외부 폰트·분석 스크립트는 필요하지 않습니다.

공개 제품 버전과 자료의 정본은 `site/product.json`입니다. 릴리스의 version, releaseDate, releaseRef, 테스트·초기 코퍼스 수치를 함께 확인하세요. 예제·스킬·템플릿은 releaseRef의 Git 커밋에서 추출해 미게시 main 변경이 공개 버전 자료와 섞이지 않도록 합니다. demo.json은 해당 CLI 버전으로 실행한 고정 예시이며, 문서 업로드나 브라우저 내 실제 lint를 제공하는 기능은 아닙니다.

FAQ 답변의 정본은 faq.json입니다. HTML과 다운로드 txt는 이 데이터에서 함께 생성합니다. Press release txt는 렌더링한 보도자료 본문에서 생성합니다. 새 릴리스에 맞춰 변경할 때 실제 기능과 공개 npm 버전을 확인하고, 성능 효과나 고객 인용문은 근거가 있을 때만 추가하세요.

2026-10-10 브라우저 QA: 데스크톱·390px 모바일 4페이지, 예시 전환, 명령 복사, FAQ 펼치기/접기, 인쇄 호출, 모바일 메뉴, 다운로드와 JavaScript 오류 없음 확인.

제품 변경 시 AGENTS.md와 [웹사이트 유지 규칙](../docs/website-maintenance.md)을 따른다. docs/site-impact.json의 검토 기록과 npm 공개 릴리스 검증을 통과한 변경만 Pages에 배포한다.

실제 변환 사례는 conversion.html과 assets/conversion/에 있습니다. 재현·갱신 절차는 [docs/conversion-case.md](../docs/conversion-case.md)를 따릅니다.

테마는 assets/theme.js가 스타일시트 로드 전에 적용합니다. 기본값은 기기의 prefers-color-scheme이며, 직접 선택은 aidocready-theme 키로 저장합니다. 색상은 style.css의 공통 변수에서 관리하고 원본 문서 이미지·PDF는 변형하지 않습니다. 인쇄는 라이트 색상을 사용합니다.

선별 사례는 conversion.html, 전체 결과는 conversion-full.html입니다. assets/conversion/selected-cases.json의 줄 범위에 해당하는 실제 결과만 발췌하며, 관련 진단을 같은 범위로 필터링합니다.

소개 페이지의 서술형 예시는 공개 SKILL을 적용한 Codex 작성과 실제 CLI 검사 결과이며 CLI 자동 변환으로 표시하지 않습니다. [작성·검증 기록](../docs/prose-examples.md)을 참고하세요.

2026-10-12: npm 0.3.0의 실제 gitHead로 공개 자료를 갱신했습니다. 명령어 없는 작성 지침은 releaseRef의 templates/REPORT-WRITING.md를 매뉴얼 전문과 다운로드에 함께 사용합니다. 390px·1440px 미리보기에서 복사·다운로드·FAQ·가로 넘침을 확인했습니다.
