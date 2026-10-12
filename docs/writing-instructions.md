# ChatGPT·Claude 작성 지침 설정

AI Doc Ready 0.3.0은 검사 전에 보고서 작성 원칙을 적용할 수 있도록 웹/앱용 지침을 내보낸다. CLI 없이 작성 지침 본문을 복사해 설정해도 된다.

```sh
npx aidocready@0.3.0 setup --target chatgpt
npx aidocready@0.3.0 setup --target claude
npx aidocready@0.3.0 setup --target chatgpt --output report-instructions.txt
npx aidocready@0.3.0 setup --target claude --format json
```

`--target`은 setup에서만 사용할 수 있다. 대상은 chatgpt 또는 claude다. 옵션 없는 setup은 기존 스킬 설정 안내를 유지한다. 지침은 고정된 작성 정책이므로 lint용 `--profile`이나 `--config`와 함께 사용할 수 없다.

터미널의 텍스트 출력에는 설정 안내와 붙여 넣을 작성 지침이 나온다. 텍스트 `--output`에는 작성 지침만 저장한다. JSON은 `schemaVersion`, `target`, `automaticSetup`, `setupSteps`, `instructions`, `sources`를 포함한다. JSON `--output`은 이 전체 객체를 저장하며 붙여 넣을 내용은 `instructions` 값이다. 기존 출력 파일이 있으면 덮어쓰지 않고 종료 코드 2와 FILE_WRITE_FAILED를 반환한다.

## 적용 위치

- ChatGPT: 웹의 설정 > 개인 설정 > 맞춤 지침에 기존 지침과 합친다. 보고서 전용 프로젝트에는 프로젝트 지침에 합친다. 앱의 개인 설정 화면은 플랫폼에 따라 다를 수 있다. [개인 설정 공식 안내](https://learn.chatgpt.com/docs/personalize), [프로젝트 공식 안내](https://learn.chatgpt.com/docs/projects).
- Claude: 설정의 Instructions for Claude에 합치거나, 보고서 전용 프로젝트의 Set project instructions에 합친 뒤 Save instructions로 저장한다. [개인화 공식 안내](https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features), [프로젝트 공식 안내](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects).

CLI 설치 없이 [작성 지침 정본](../templates/REPORT-WRITING.md)의 본문을 직접 복사해도 된다. 파일을 첨부하는 것과 지침 설정란에 저장하는 것은 다르다. 지침 설정란에 붙여 넣고 저장한다. 계정이나 프로젝트 설정은 자동 변경하지 않는다.

공식 서비스 안내 확인일: 2026-10-12. 메뉴 이름·제공 범위는 서비스와 앱 버전에 따라 바뀔 수 있다.

## 작성 정책과 확인

행안부 원칙과 자체 보완 지침을 별도로 표시한다. 중첩 표 지양은 공식 보도자료의 시범운영 설명에 근거한다. [규칙 근거](rule-provenance.md)를 참고한다. 원문 사실 보존·목적별 형식 선택·작성 후 검토는 자체 보완 지침이다. 구조 검사 프로파일 JSON은 모델의 작성 지침으로 대신 사용할 수 없다.

보고서·문서 작성 요청에서만 정책을 적용한다. 사용자가 원문을 제공하면 표·그림 상단 제목과 순서 표시, 단순 병합, 서술식 문장, 항목 표시와 꾸미기를 확인한다. 표와 목록은 독자 목적에 맞게 유지한다. 필요한 형식을 일괄 제거하지 않는다.

설정 후 새 대화에서 제목 없는 비교표와 불완전한 원문을 제공하고 보고서를 작성하도록 요청한다. 표 제목·순서 표시를 추가하는지, 원문 수치·단위·조건을 유지하는지, 미제공 사실을 추정하지 않는지 확인한다. 모델의 실행 결과는 사람이 대조한다. CLI가 없는 웹 대화에서도 이 작성 정책을 적용할 수 있으며, 실행하지 않은 lint를 실행했다고 보고하지 않도록 지침에 명시했다.

지침 저장은 모델의 모든 응답이나 공식 원칙 준수를 보증하지 않는다. 실제 문서 파일은 기존 lint로 별도 검사하고, 사실·의미와 시각적 적절성은 사람이 최종 검토한다.
