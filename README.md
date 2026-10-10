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

로컬 개발 중에는 빌드한 `node dist/cli.js` 명령으로 실행합니다. 아래 개선 기능은 GitHub 소스를 빌드한 0.2.0 개발본 기준이며, 기존 npm 0.1.0에는 아직 반영되지 않았습니다.

```sh
node dist/cli.js lint reports/ --format json --output result.json
node dist/cli.js lint report.md --config examples/profile.json
cat report.md | node dist/cli.js lint - --format json
node dist/cli.js rules MOIS-TABLE-CAPTION
node dist/cli.js doctor --format json
node dist/cli.js setup
```

파일 여러 개 또는 디렉터리를 입력하면 지원 형식을 재귀 검사합니다. 결과 파일은 원본이나 설정 파일을 덮어쓸 수 없습니다. `setup`은 설치 자산의 위치와 적용 방법만 안내하며 기존 에이전트 설정을 변경하지 않습니다.

## 범위와 출력

Markdown(GFM)과 HWPX를 읽고 원본을 수정하지 않습니다. 표·그림 상단 제목, 제목 번호, 번호 단계, 중첩 표, 양방향 셀 병합 검토 후보를 검사합니다. Markdown 제목 단계, 같은 단계의 번호 연속성은 자체 보완 규칙입니다.

- `Error`: 자체 제목 구조 오류.
- `Warning`: 인식된 구조의 개선 후보.
- `Suggestion`: 사람이 판단해야 하는 검토 후보.

기본 실패 기준은 Error입니다. `--fail-on Warning`은 Error/Warning에, `--fail-on Suggestion`은 모든 진단에 종료 코드 1을 반환합니다. 검사 불완전도 항상 1입니다. 성공은 0, 파일·옵션·파싱 오류는 2입니다.

JSON은 `schemaVersion`, `file`, `inputFormat`, `profile`, `findings`, `summary`, `coverage`, `parserWarnings`, `checks`를 포함합니다. `checks`는 규칙별로 `checked`, `not-applicable`, `unsupported`, `manual-review`, `disabled`를 구분합니다. 검사 상태는 공식 준수 판정이 아닙니다. 각 진단은 규칙 ID, 출처 구분, 심각도, 원문 발췌, 도움말 링크, 원본 줄 번호(Markdown) 또는 블록 경로(HWPX)를 제공합니다. HWPX의 page는 실제 쪽 번호가 아니라 Kordoc 섹션 근사치일 수 있습니다.

`mois-core`는 공식 원칙에 근거한 검사만 선택합니다. `recommended`는 자체 보완 규칙을 함께 사용합니다. 이 프로파일과 규칙 ID, 심각도, 인식 문법은 aidocready의 설계이며 행안부 공식 규격·인증·기계 판독 스키마가 아닙니다. 프로파일 JSON은 이식 가능한 배포 데이터입니다. 기본 프로파일 JSON은 생성된 메타데이터입니다. 사용자 설정은 별도의 `--config` 파일로 읽으며 [예제](examples/profile.json)를 참고하세요. 알 수 없는 규칙·심각도·속성은 거부하고, 사용자 프로파일은 `profileOrigin=aidocready`로 구분합니다.

## 검사 한계

상단 제목은 바로 앞 문단의 `표 1. 제목`, `[표 1] 제목`, `그림 1. 제목`, `< 제목 >` 등을 인식합니다. 제목 존재와 순서 표시는 별도로 검사하며, 번호 없는 제목의 다른 순서 표시는 수동 검토합니다. 다른 상단 제목·순서 표시도 공식 원칙을 충족할 수 있습니다. 인식 실패를 공식 위반 확정으로 해석하지 마세요. 원본의 번호를 새로 만들어 사실처럼 추가하지 마세요.

셀 병합은 금지하지 않습니다. 행과 열을 동시에 병합한 셀만 검토 후보로 제안합니다. 공식적인 병합 개수·복잡도 기준은 추가하지 않았습니다. 단방향 병합이 항상 단순하다고 보장하지도 않습니다.

Markdown의 원시 HTML 구조는 검사하지 않습니다. 누락을 숨기지 않고 `coverage.complete=false`와 종료 코드 1로 표시합니다. 코드 블록은 문서 규칙 검사에서 제외합니다. HWPX는 Kordoc IR의 원본 표 구조를 보존하는 옵션을 사용하며 파서 경고를 결과에 포함합니다. 내장 표 캡션의 상단/하단 위치는 IR에서 알 수 없어 검토 대상으로 남깁니다.

정적 lint 통과는 문장 명확성, 서술식 작성, 꾸미기 적절성 또는 사실 보존의 보증이 아닙니다. `coverage.complete`는 이 MVP가 지원하는 구조의 검사 누락 여부이며 공식 원칙 전체 준수 여부가 아닙니다. 호스트 에이전트가 원문과 비교하고 사람이 최종 검토합니다. 문서 내용·수치·해석을 자동 생성하거나 수정하는 기능은 없습니다.

## 에이전트 사용

[SKILL.md](skills/aidocready/SKILL.md), [AGENTS.md 템플릿](templates/AGENTS.md), [CLAUDE.md 템플릿](templates/CLAUDE.md)을 제공합니다. 스킬 설치와 상시 지침 적용은 자동 수행하지 않습니다. 기존 상시 지침에는 관련 부분만 합치세요. 작성 → lint(JSON) → 출처 비교 → 수정 → 재검사의 루프를 사용합니다.

공식 근거와 자체 해석은 [규칙 근거](docs/rule-provenance.md)를 확인하세요.

## Kordoc 업스트림 대응

매주 월요일 09:00 KST에 안정 릴리스를 확인합니다. 새 버전이 있으면 pi와 DeepSeek Flash가 호환성을 점검·수정하고, Node.js 20·22·24 검사 후 draft PR을 생성합니다. [운영·수동 테스트 안내](docs/upstream-maintenance.md)를 확인하세요.

## 공개 API와 오류 처리

```ts
import { lintFile, lintMarkdown, loadProfile } from "aidocready";

const report = await lintFile("report.hwpx");
const profile = await loadProfile("profile.json");
const draft = lintMarkdown("# 보고서\n\n본문이다.", profile);
```

SDK는 `AidocreadyError.code`로 오류 원인을 제공합니다. CLI는 기존 `error.code=INPUT_ERROR`를 유지하고 `error.reason`에 `FILE_NOT_FOUND`, `INVALID_PROFILE`, `PARSE_FAILED` 등의 원인을 추가합니다. Kordoc 오류는 `causeCode`로 보존합니다. 여러 입력의 JSON은 `results`, `errors`, 합산 `summary`를 포함하며, 운영 오류가 있으면 다른 파일도 검사한 뒤 종료 코드 2를 반환합니다.

## 품질 게이트

```sh
npm run check:meta
npm run test:corpus
npm run test:package
```

규칙 정본에서 프로파일과 [규칙 도움말](docs/rules.md)을 생성하고, 내용이 어긋나면 검사에 실패합니다. 출처와 사람이 검토한 기대 진단을 기록한 8개 초기 회귀 사례를 문서별로 비교합니다. 이 작은 코퍼스의 통과는 전체 행정문서에 대한 정확도나 공식 준수율을 뜻하지 않습니다. 깨끗한 환경에 npm tarball을 설치해 CLI·공개 API·선택 의존성 없는 HWPX·스킬 자산도 검사합니다. CI와 주간 업스트림 검증에 같은 게이트를 적용합니다.

[경량 설치와 오프라인 운영](docs/offline-usage.md), [회귀 코퍼스 기준](docs/corpus.md), [변경 이력](CHANGELOG.md)을 확인하세요.
