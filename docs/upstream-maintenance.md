# Kordoc upstream maintenance

매주 월요일 09:00 KST(UTC 00:00)에 `.github/workflows/kordoc-upstream.yml`이 실행됩니다. GitHub 예약 실행은 지연될 수 있습니다.

npm의 Kordoc latest 안정 릴리스와 현재 정확히 고정한 버전을 비교합니다. 더 새 버전이 없으면 API 호출·PR 생성 없이 종료합니다. 이미 사용하는 버전보다 오래된 latest로 내려가지 않습니다. 미출시 upstream 커밋은 자동 적용하지 않습니다.

새 버전이 있으면 정확한 의존성을 업데이트한 뒤 pi 1.1.0을 사용합니다. 모델은 DeepSeek 공식 API의 `deepseek-flash`입니다. 출력 한도는 호출당 16,384 토큰, 에이전트 시간 한도는 20분입니다. 총 비용 한도는 아닙니다.

## 인증

저장소의 Actions 시크릿 `DEEPSEEK_API_KEY`를 사용합니다. 다른 이름이면 저장소 변수 `KORDOC_DEEPSEEK_SECRET`에 그 시크릿 이름을 지정합니다. 키 값은 파일이나 워크플로에 기록하지 않습니다. 모델 설정은 pi의 기본 DeepSeek 공급자를 사용하고 출력 한도만 덮어씁니다.

GitHub 토큰은 검증 후 PR을 생성하는 별도 작업에만 쓰기 권한이 있습니다. pi 작업에는 GitHub 게시용 토큰을 전달하지 않습니다. checkout 인증도 저장하지 않습니다. 키 값, pi 전체 대화와 추론은 업로드하지 않습니다. 최종 요약만 시크릿을 지운 뒤 업로드합니다.

## 검사와 PR

에이전트가 호환성 수정과 테스트를 수행합니다. 이후 새 환경에서 Node.js 20, 22, 24로 타입 검사, 전체 테스트, 빌드와 Markdown/HWPX 예제 CLI를 다시 실행합니다. 모두 통과한 패치만 버전별 `automation/kordoc-<version>` 브랜치와 draft PR로 생성·갱신합니다. 실행 중 main이 바뀌면 PR 생성은 중단하며 재실행해야 합니다.

공식 원칙과 자체 규칙 구분, 사실 보존, Node.js 20 지원을 유지해야 합니다. 워크플로·테스트 명령·다른 의존성·버전 변경은 차단합니다. 모델의 수정 결과를 읽고 검토한 뒤 병합합니다. npm 게시는 자동으로 하지 않습니다.

기본 `GITHUB_TOKEN`으로 생성한 PR은 추가 CI를 자동 시작하지 않으므로 이 워크플로의 검증 작업을 결과 근거로 사용합니다. 검증 링크는 PR 본문에 기록합니다. 실행이 실패하면 Actions 로그에서 원인을 확인합니다.

## 수동 검증

GitHub Actions의 **Kordoc upstream → Run workflow**에서 기본 실행은 최신 릴리스 여부만 확인합니다. `audit_only=true`는 새 버전이 없어도 실제 pi/DeepSeek로 현재 버전의 통합을 점검합니다. 저장소 변경·PR은 생성하지 않으며, 세 Node 버전의 전체 검사도 수행합니다.

참고: [pi CLI](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli.md), [pi 모델 설정](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md), [DeepSeek 모델 이름](https://api-docs.deepseek.com/quick_start/pricing/).
