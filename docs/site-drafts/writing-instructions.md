# 작성 지침 설정 — 다음 릴리스 문서 초안

미출시 기능이다. npm 공개와 실제 명령 검증 전에는 공개 페이지에 반영하지 않는다. 기존 형식 선택 정책 초안도 유지한다.

## 소개

AI Doc Ready는 문서 구조 검사에 더해 ChatGPT·Claude에서 작성 단계부터 AI 친화적 보고서 원칙을 적용하도록 돕는다. 작성 지침을 출력해 개인 지침이나 프로젝트 지침에 저장할 수 있다. 계정 설정은 사용자가 직접 저장한다.

## 매뉴얼

릴리스 후 검증된 버전으로 `aidocready setup --target chatgpt` 또는 `aidocready setup --target claude`를 실행한다. 텍스트 출력은 설정 안내와 작성 지침을 제공한다. `--output instructions.txt`는 붙여 넣을 지침만 새 파일에 저장하며 기존 파일은 덮어쓰지 않는다. JSON의 `instructions`는 작성 지침, `setupSteps`는 적용 위치 안내다.

ChatGPT는 맞춤 지침 또는 프로젝트 지침, Claude는 Instructions for Claude 또는 프로젝트 지침에 저장한다. 기존 지침과 합친다. CLI 없이 배포된 작성 지침을 복사할 수도 있다. 상세 절차와 공식 서비스 안내는 docs/writing-instructions.md를 따른다.

## FAQ

- 작성부터 원칙을 적용할 수 있나요? 웹/앱용 작성 지침을 설정하면 초안 작성과 원문 대조에 원칙을 적용하도록 요청할 수 있습니다. 모델의 준수와 사실 보존은 별도 검토가 필요합니다.
- ChatGPT·Claude 계정 설정을 자동 변경하나요? 지침과 설정 위치를 제공하며 사용자가 직접 붙여 넣고 저장합니다.
- 웹 대화에서 CLI가 필요한가요? 작성 지침 자체에는 필요하지 않습니다. 저장한 문서의 구조 검사는 CLI에서 별도로 실행합니다.

## 보도자료

ChatGPT·Claude에서 보고서 작성 단계부터 행안부 원칙을 적용하도록 돕는 지침 내보내기를 추가한다. 상단 제목과 순서 표시, 단순 병합, 서술식 문장, 일관된 항목 표시와 꾸미기 지양을 안내하며, 원문 사실 보존과 목적별 형식 선택은 자체 보완 정책으로 구분한다. 공식 인증이나 자동 준수 보증 기능으로 소개하지 않는다.

## 0.3.0 공개 준비 상태 (2026-10-12)

출시 소스: 1a21fce3e4ca7e97c93a320e58da75e91c7dabee. 로컬 테스트 128개, 타입 검사, 생성 메타데이터, 회귀 사례 8개, npm tarball 설치와 GitHub Node.js 20·22·24 CI가 통과했다. npm whoami는 E401로 거부되며 현재 공개 버전은 0.2.0이다. 인증 복구 후 출시 안내 문구를 정리한 새 커밋을 npm gitHead로 사용한다.

공개 페이지 변경 초안은 [release-0.3.0.patch](release-0.3.0.patch)에 보존했다. 매뉴얼 지침 전문·복사·다운로드, 서비스별 설정 절차, 소개·FAQ·보도자료와 빌더를 포함한다. 390px·1440px 화면, 지침 복사·다운로드 일치, FAQ 펼치기와 내부 링크를 미리보기에서 확인했다.

이 패치는 아직 적용하지 않는다. npm 0.3.0 공개 후 실제 npm gitHead로 releaseRef를 갱신하고, 공개 npm CLI로 모든 사례와 demo.json을 다시 검사해 JSON·provenance 해시를 갱신한다. 패치의 사례 결과는 로컬 0.3.0 CLI로 준비한 자료이며 공개 npm 검사 완료를 뜻하지 않는다. 기존 작성 예시를 새 스킬로 다시 작성한 것으로 표시하지 않는다. docs/site-impact.json은 현재 pending-release이며, 공개 문서 반영 시 updated로 바꾸고 check:site·check:site-release와 Pages 배포·실제 URL을 확인한다.

미리보기: /private/tmp/aidocready-release-preview/_site. 자산 재검사 스크립트: /private/tmp/aidocready-refresh-release-assets.mjs. 게시 후 AIDOCREADY_RELEASE_BINARY에 설치한 공개 npm CLI 경로를 지정해 다시 실행할 수 있다.
