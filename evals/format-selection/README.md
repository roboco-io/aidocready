# Live format-selection evaluation

이 평가는 `docs/format-policy.md`와 작업 중인 `skills/aidocready/SKILL.md`를 두 공식 SDK에 같은 텍스트로 제공한다. SKILL 자동 검색·설치 기능을 시험하는 것은 아니다. 에이전트는 새 세션마다 가상 사실만 받아 형식과 이유, Markdown을 반환한다. 정답 형식·채점 구문은 프롬프트에서 제외한다.

## 실행

저장소 루트에서 실행한다. Node.js 20 이상과 각 서비스의 유효한 인증이 필요하다. Codex CLI의 ChatGPT 로그인, Claude Code의 지원되는 로그인 또는 SDK 공식 인증 방식을 사용한다. 인증 파일을 복사하거나 키를 저장소에 넣지 않는다.

```sh
npm ci
npm run build
npm ci --prefix evals/format-selection
npm run test:agents -- --provider both --repeat 2
```

모델을 생략하면 실행기의 기본값을 사용한다. 비교 재현을 위해 `ADR_CODEX_MODEL`, `ADR_CLAUDE_MODEL`을 지정할 수 있다. 결과에는 실제 Claude 모델과 지정된 Codex 모델을 기록한다. Codex 모델을 생략한 경우 `configured-default`로만 기록하므로 모델을 고정해 재현하려면 환경변수를 명시한다.

```sh
npm run test:agents -- --provider codex --case compare-values --repeat 1
npm run test:agents -- --provider claude --case ordered-procedure --repeat 1
```

`--out`은 결과 디렉터리, `--timeout`은 요청당 제한 시간(ms, 기본 180000)이다. 반복은 1~5회다. 기본 출력 경로 `evals/format-selection/results/`는 Git에서 제외한다. 실행 오류가 발생한 제공자는 남은 요청을 중단하고 미실행 수를 기록한다. 다른 제공자는 독립적으로 진행한다. 실패·미실행은 프로세스 종료 코드 1이며 통과로 처리하지 않는다. 요청 취소도 동일하다. 인증과 사용량 제한은 각 계정에 따른다. Claude 요청당 SDK 예산 상한은 1 USD이며 기록 비용은 추정치다.

## 평가 사례

| 사례 | 독자의 작업 | 허용 형식 |
| --- | --- | --- |
| compare-values | 대안의 동일 속성·가격·용량·담당 비교 | 표 |
| decision-reasons | 선택 근거·제약·실패 조건 검토 | 서술형 |
| ordered-procedure | 선행 조건을 지키는 작업 수행 | 번호 목록 |
| independent-checklist | 순서 없는 준비 상태 확인 | 불릿 목록 |
| term-descriptions | 용어의 의미 조회 | 목록 또는 표 |
| mixed-report | 배경 설명 + 대안 비교 + 준비 실행 | 단락별 서술형·표·번호 목록 |
| missing-value | 빠진 가격을 추정하지 않고 비교 | 표 + 확인 질문 |
| explicit-user-format | 사용자가 명시한 한 문단 형식 준수 | 서술형 |

서술형을 모두 정답으로 만들지 않는다. 숫자와 고유명사는 가상 평가 자료이며 실제 상품이나 성능 수치가 아니다.

## 채점과 한계

- 선택 형식이 사전에 정한 허용 집합에 속하는지, 실제 Markdown AST가 그 형식인지 확인한다.
- 순서 목록·불릿을 구분하고 필수 단계의 순서를 확인한다.
- 핵심 사실 표현, 수치 추가, 표 행의 값 대응, 질문 필요 여부를 검사한다.
- 반환 Markdown을 동일한 로컬 aidocready 엔진으로 검사해 Warning/Error 및 불완전 coverage를 표시한다. 모델의 자기 보고를 검사 결과로 사용하지 않는다.
- SDK의 일반 도구 호출은 허용하지 않는다. Claude는 tools/skills/settings를 비우고, Codex는 읽기 전용·승인 없음·셸/멀티에이전트/웹 검색 비활성화를 요청한다. JSON 반환용 내부 StructuredOutput은 일반 도구 호출로 세지 않는다.
- 일반 `npm test`는 채점기의 회귀 테스트만 실행하며 유료 네트워크 호출을 하지 않는다. live 평가는 명시적인 `test:agents` 명령으로만 수행한다.

핵심 표현·숫자·행 대응 검사는 의미 보존 전체를 증명하지 않는다. 동의어 때문에 보수적인 실패가 발생할 수 있고, 정성적 사실의 추가나 조건 반전은 수동 검토가 필요하다. `reason`은 사용자에게 보일 선택 근거이며 내부 사고 과정을 요구하지 않는다. 충분한 길이의 근거가 존재하는지만 자동 확인하고 타당성은 결과와 함께 검토한다.

이는 소수 합성 사례의 정책 조건부 점검이다. 두 모델의 우열, 정책의 인과 효과, 실제 문서 정확도나 공식 준수율로 해석하지 않는다. 반복마다 새 세션을 만들며 제공자별 원시 결과·JSON·검사 결과·사용량·정책/자료 해시와 요약을 저장한다. 모델 출력은 명령으로 실행하지 않는다. SDK는 eval 전용 private 패키지에 고정하며 배포 CLI 의존성에 포함하지 않는다.

공식 SDK 문서: [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk), [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview), [Claude structured outputs](https://code.claude.com/docs/en/agent-sdk/structured-outputs). Claude Code SDK의 현재 패키지 이름은 `@anthropic-ai/claude-agent-sdk`다.

## 재채점

동등 표현 허용이나 채점기 오류를 고칠 때 기존 모델 응답을 지우거나 다시 실행한 것처럼 계산하지 않는다.

```sh
node evals/format-selection/rescore.mjs evals/format-selection/results/ORIGINAL evals/format-selection/results/NEW-SCORE
```

원래 policy/skill/engine 버전과 각 프롬프트 SHA가 같을 때만 재채점한다. 정답 집합·채점 조건은 프롬프트에 포함되지 않으므로 채점기 개선으로 바꿀 수 있다. 출력은 반드시 새로운 빈 디렉터리로 쓰며 `originalGrade`를 보존한다. 신규 실제 실행은 grader/adapter/runner/lockfile 해시와 Node 버전도 기록한다. 재채점은 별도 grader/oracle 해시를 남긴다.

목록의 경우 핵심 사실이 실제 목록 항목 안에 있어야 하고, 지정한 주요 단계·확인 항목이 서로 다른 항목에 배치돼야 한다. 한 문단 요청은 실제 문단 수를 검사한다. 미확인과 ‘확인되지 않았다’처럼 명시적으로 허용한 동등 표현을 인정하되 긍정 표현은 인정하지 않는다. 이 규칙도 완전한 자연어 의미 판정기는 아니다.

검토 가능한 첫 실제 실행의 응답은 [evidence/2026-10-10.json](evidence/2026-10-10.json)에 보존한다. 세션 ID·인증 정보·사용자 경로를 제외한 공개 가상 사례 응답이며, 원래 결과·재채점·수동 검토 한계를 구분한다. 결과 요약은 [docs/format-eval-results.md](../../docs/format-eval-results.md)에 있다.
