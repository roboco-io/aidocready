# GitHub Pages 제품 사이트

소개, 사용 매뉴얼, 고객·제품 전략 FAQ와 Press release를 제공합니다. GitHub Pages에 공개하며 조직의 기존 Pages 도메인인 `https://roboco.io/aidocready/`를 사용합니다.

`node scripts/build-site.mjs`로 `_site/`를 만들고 내부 문서·앵커·다운로드 링크를 검증합니다. Pages 워크플로는 main의 사이트 변경을 배포합니다. 별도 npm 설치나 외부 폰트·분석 스크립트는 필요하지 않습니다.

공개 제품 버전과 자료의 정본은 `site/product.json`입니다. 릴리스의 version, releaseDate, releaseRef, 테스트·초기 코퍼스 수치를 함께 확인하세요. 예제·스킬·템플릿은 releaseRef의 Git 커밋에서 추출해 미게시 main 변경이 공개 버전 자료와 섞이지 않도록 합니다. demo.json은 해당 CLI 버전으로 실행한 고정 예시이며, 문서 업로드나 브라우저 내 실제 lint를 제공하는 기능은 아닙니다.

FAQ 답변의 정본은 faq.json입니다. HTML과 다운로드 txt는 이 데이터에서 함께 생성합니다. Press release txt는 렌더링한 보도자료 본문에서 생성합니다. 새 릴리스에 맞춰 변경할 때 실제 기능과 공개 npm 버전을 확인하고, 성능 효과나 고객 인용문은 근거가 있을 때만 추가하세요.

2026-10-10 브라우저 QA: 데스크톱·390px 모바일 4페이지, 예시 전환, 명령 복사, FAQ 펼치기/접기, 인쇄 호출, 모바일 메뉴, 다운로드와 JavaScript 오류 없음 확인.
