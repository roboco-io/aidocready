# 경량 설치와 오프라인 운영

Markdown/HWPX만 검사하는 기본 범위는 PDF/OCR의 선택 의존성을 요구하지 않습니다. 배포용 tarball을 빈 프로젝트에 `npm install --ignore-scripts --omit=optional --omit=dev <tarball>`로 설치하고 실제 HWPX 검사와 공개 API를 실행하는 게이트를 제공합니다. 일반 설치의 총 크기는 OS·의존성 버전에 따라 달라집니다.

인터넷이 가능한 준비 환경에서 대상 OS/CPU와 같은 조건으로 패키지와 의존성을 설치한 뒤 설치 디렉터리를 반입할 수 있습니다. 오프라인 환경에서는 이미 설치된 `node node_modules/aidocready/dist/cli.js` 또는 `npx --no-install aidocready`를 사용하세요. `npm ci`, 일반 `npx`와 설치 명령은 레지스트리 접근이 필요할 수 있습니다. 정적 CLI는 문서를 외부로 전송하지 않습니다. 별도 호스트 에이전트와 주간 pi 워크플로는 모델 API를 사용하므로 그 데이터 흐름은 별도로 판단해야 합니다.

입력 자원 한도는 보고서 작성 원칙이 아니라 프로젝트 운영 제한입니다. 기본 문서/Markdown stdin 한도는 64 MiB이고, 구조 중첩은 64단계입니다. `lintFile(path, profile, { maxBytes })`로 더 작은 파일 한도를 적용할 수 있습니다. 제한을 넘으면 `INPUT_TOO_LARGE` 원인을 반환합니다. 이 제한은 프로세스 샌드박스나 전체 실행시간 제한을 보장하지 않습니다. Kordoc의 ZIP 해제 제한은 별도로 적용됩니다.

`doctor`는 로컬 Node·패키지·Kordoc 버전과 스킬 자산 경로를 보여 줍니다. API 키나 네트워크 인증은 정적 lint 실행에 필요하지 않습니다. `setup`은 안내만 출력하며 홈 디렉터리나 기존 지침을 수정하지 않습니다.
