# 초기 MVP 실행 검증

2026-10-10 최초 MVP 구현 직후의 검증 기록입니다. 이 검증 시점에는 외부 저장소 생성·푸시·npm 게시를 수행하지 않았습니다. 이후 릴리스 이력은 CHANGELOG와 GitHub Releases를 확인하세요.

- 빌드: `npm run build` 통과.
- 타입 검사: `npm run check` 통과.
- 자동 테스트: `npm test` 38개 통과. 규칙별 검사, CLI JSON/종료 코드, 파싱 오류, 실제 Kordoc HWPX 생성·재파싱, 원본 바이트 불변, 병합·중첩 표, HTML 검사 누락, 셀 이미지와 같은 줄 캡션을 포함합니다.
- Node.js 20.20.2에서 같은 전체 테스트 통과.
- Markdown·HWPX 예제의 빌드 CLI 실행: 진단 0개.
- 로컬 npm 압축 패키지의 HWPX CLI 실행 확인. 외부 게시 없음.
- 스킬 frontmatter 및 구조 검증 통과. 실제 에이전트 자동 호출·전역 설치 동작은 검증하지 않았습니다.
- 독립 코드 리뷰의 Markdown 예외 입력 4건을 재현하고 5개 회귀 테스트로 수정했습니다.

HWPX는 `layoutTables: 'keep'`, `keepTrailingEmptyCols: true`, `ocr: false`로 파싱합니다. Kordoc 기본 시각적 단순화가 원본 병합 정보를 바꾸는 것을 방지합니다. 생성한 예제는 테스트 자료이며 실제 행정 보고서의 품질 보증을 뜻하지 않습니다.

공식 PDF를 시각 확인했으며 사용자 첨부 파일과의 바이트 동일성은 확인하지 않았습니다. 문장의 명확성·내용 보존·실제 HWPX 렌더 품질은 별도 사람이 검토해야 합니다.
