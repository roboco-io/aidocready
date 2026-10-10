# AI Doc Ready

**AI Doc Ready** (`aidocready`)는 사람과 AI가 보고서의 구조와 맥락을 이해하기 쉽도록 돕는 문서 검사 도구입니다. Markdown과 HWPX 보고서를 읽고, AI 친화적 작성 원칙에 근거한 구조 검사를 수행합니다. TypeScript로 구현했으며 Node.js 20 이상을 사용합니다.

## 프로젝트의 시작

이 프로젝트는 행정안전부의 [「복잡한 표·그림 대신 고품질 텍스트로 행안부, 인공지능(AI) 친화적 보고서 전면 도입」 발표](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)를 계기로 시작되었습니다.

행안부가 제시한 표·그림의 상단 제목과 순서 표시, 단순한 셀 병합, 서술식 문장, 일관된 항목 표시, 불필요한 시각적 꾸미기 지양을 실제 문서 작성 과정에서 적용하고 확인하는 것이 출발점입니다. AI Doc Ready는 이러한 원칙을 여러 AI 에이전트에서 활용할 수 있는 규칙·프로파일·CLI와 작성 → 검사 → 수정의 흐름으로 제공합니다.

공식 원칙과 AI Doc Ready의 자체 보완 규칙을 구분합니다. 구조 검사는 재현 가능한 코드로 수행하고, 문장의 명확성과 사실·수치·의미 보존은 원문 대조와 수동 검토로 확인합니다.

## Kordoc과의 역할 분담

한국 문서 처리 라이브러리 [Kordoc](https://github.com/chrisryugj/kordoc)을 기반으로 HWPX를 읽습니다. Kordoc은 문서 파싱을 담당하고, AI Doc Ready는 추출한 구조에 보고서 검사 규칙을 적용합니다. Kordoc 4.21.9를 수정하지 않은 라이브러리 의존성으로 사용합니다.

## 빠른 시작

```sh
npx aidocready@0.1.0 lint report.md
npx aidocready@0.1.0 lint report.hwpx --format json
```

## 로컬 개발

```sh
npm ci
npm run build
node dist/cli.js lint examples/report.md
node dist/cli.js lint examples/report.hwpx --format json
node dist/cli.js lint examples/report.md --profile mois-core --fail-on Warning
node dist/cli.js rules --format json
npm test
npm run check
```

로컬 개발 중에는 빌드한 `node dist/cli.js` 명령으로 실행합니다.

## 범위와 출력

Markdown(GFM)과 HWPX를 읽고 원본을 수정하지 않습니다. 표·그림 상단 제목, 제목 번호, 번호 단계, 중첩 표, 양방향 셀 병합 검토 후보를 검사합니다. Markdown 제목 단계, 같은 단계의 번호 연속성은 자체 보완 규칙입니다.

- `Error`: 자체 제목 구조 오류.
- `Warning`: 인식된 구조의 개선 후보.
- `Suggestion`: 사람이 판단해야 하는 검토 후보.

기본 실패 기준은 Error입니다. `--fail-on Warning`은 Error/Warning에, `--fail-on Suggestion`은 모든 진단에 종료 코드 1을 반환합니다. 검사 불완전도 항상 1입니다. 성공은 0, 파일·옵션·파싱 오류는 2입니다.

JSON은 `schemaVersion`, `file`, `inputFormat`, `profile`, `findings`, `summary`, `coverage`, `parserWarnings`를 포함합니다. 각 진단은 규칙 ID, 출처 구분, 심각도, 원본 줄 번호(Markdown) 또는 블록 경로(HWPX)를 제공합니다. HWPX의 page는 실제 쪽 번호가 아니라 Kordoc 섹션 근사치일 수 있습니다.

`mois-core`는 공식 원칙에 근거한 검사만 선택합니다. `recommended`는 자체 보완 규칙을 함께 사용합니다. 이 프로파일과 규칙 ID, 심각도, 인식 문법은 aidocready의 설계이며 행안부 공식 규격·인증·기계 판독 스키마가 아닙니다. 프로파일 JSON은 이식 가능한 배포 데이터입니다. 사용자 정의 설정 파일 로드는 MVP 범위 밖입니다.

## 검사 한계

상단 제목은 바로 앞 문단의 `표 1. 제목`, `[표 1] 제목`, `그림 1. 제목` 등을 인식합니다. 다른 상단 제목·순서 표시도 공식 원칙을 충족할 수 있습니다. 인식 실패를 공식 위반 확정으로 해석하지 마세요. 원본의 번호를 새로 만들어 사실처럼 추가하지 마세요.

셀 병합은 금지하지 않습니다. 행과 열을 동시에 병합한 셀만 검토 후보로 제안합니다. 공식적인 병합 개수·복잡도 기준은 추가하지 않았습니다. 단방향 병합이 항상 단순하다고 보장하지도 않습니다.

Markdown의 원시 HTML 구조는 검사하지 않습니다. 누락을 숨기지 않고 `coverage.complete=false`와 종료 코드 1로 표시합니다. 코드 블록은 문서 규칙 검사에서 제외합니다. HWPX는 Kordoc IR의 원본 표 구조를 보존하는 옵션을 사용하며 파서 경고를 결과에 포함합니다. 내장 표 캡션의 상단/하단 위치는 IR에서 알 수 없어 검토 대상으로 남깁니다.

정적 lint 통과는 문장 명확성, 서술식 작성, 꾸미기 적절성 또는 사실 보존의 보증이 아닙니다. `coverage.complete`는 이 MVP가 지원하는 구조의 검사 누락 여부이며 공식 원칙 전체 준수 여부가 아닙니다. 호스트 에이전트가 원문과 비교하고 사람이 최종 검토합니다. 문서 내용·수치·해석을 자동 생성하거나 수정하는 기능은 없습니다.

## 에이전트 사용

[SKILL.md](skills/aidocready/SKILL.md), [AGENTS.md 템플릿](templates/AGENTS.md), [CLAUDE.md 템플릿](templates/CLAUDE.md)을 제공합니다. 스킬 설치와 상시 지침 적용은 자동 수행하지 않습니다. 기존 상시 지침에는 관련 부분만 합치세요. 작성 → lint(JSON) → 출처 비교 → 수정 → 재검사의 루프를 사용합니다.

공식 근거와 자체 해석은 [규칙 근거](docs/rule-provenance.md)를 확인하세요.

## Kordoc 업스트림 대응

매주 월요일 09:00 KST에 안정 릴리스를 확인합니다. 새 버전이 있으면 pi와 DeepSeek Flash가 호환성을 점검·수정하고, Node.js 20·22·24 검사 후 draft PR을 생성합니다. [운영·수동 테스트 안내](docs/upstream-maintenance.md)를 확인하세요.
