# 실제 변환 사례 유지 방법

공개 사례는 hwp2md의 `2b6a230827a437545ce1a20468b20747869a2982` 커밋에 있는 `testdata/한글 테스트.hwpx`다. 같은 저장소의 참고 PDF는 두 쪽을 한 장에 배치한다. 원 출처는 hwp2md README가 명시한 한국문화원 문서 뷰어 테스트 자료다. 과거 채용 공고이며 현재 채용 정보로 소개하지 않는다.

2026-10-10에 해당 커밋을 Go 1.25.8로 빌드해 내장 파서 Stage 1만 실행했다. LLM 및 외부 파서 API를 사용하지 않았다. 자동 변환 Markdown은 편집하지 않았다. 공개 npm `aidocready@0.2.0`을 별도 설치해 검사했고 JSON의 file만 다운로드 파일명 `converted.md`로 정규화했다. JSON 본문 전체와 SHA-256을 공개한다.

```sh
git clone https://github.com/roboco-io/hwp2md.git
cd hwp2md
git checkout 2b6a230827a437545ce1a20468b20747869a2982
go build -o hwp2md ./cmd/hwp2md
# 기존 ~/.hwp2md/config.yaml의 llm.enabled가 false인지 먼저 확인한다.
HWP2MD_LLM=false ./hwp2md convert 'testdata/한글 테스트.hwpx' --parser native --llm=false -o converted.md
npx aidocready@0.2.0 lint converted.md --format json --output lint.json
```

원본 HWPX, 참고 PDF, HWPX 내장 첫 페이지 미리보기, 변환 Markdown, JSON, hwp2md MIT 고지는 site/assets/conversion/에 있다. provenance.json은 원본/Markdown/JSON 해시, 변환 커밋과 공개 엔진 버전을 기록한다. 빌더가 해시·진단 합계·공개 버전을 검증하고 결과에서 비교 페이지를 만든다. 현재 합계는 Warning 63개다. 표 제목 60개, 번호 순서 2개, 미지원 구조 안내 1개다. 서식용 표도 진단에 포함된다.

HTML 줄바꿈 등의 미지원 구조가 있어 coverage.complete는 false다. HTML 내부의 병합 의미 등을 검사하지 못한다. 원본 HWPX 직접 검사와 변환 Markdown 검사에서 보존되는 구조가 다르므로 진단 수를 개선율로 비교하지 않는다. 정적 통과는 사실·수치 보존의 보증이 아니다.

공개 엔진 버전이 바뀌면 해당 npm 버전으로 실제 검사한 JSON과 provenance를 함께 갱신한다. 변환기 커밋이나 원본을 바꾸면 자동 변환도 다시 수행한다. 메인의 발췌 표/설명/진단 위치와 전체 결과를 대조하고 docs/site-impact.json을 갱신한다. 빌더의 읽기 보기는 텍스트를 이스케이프하며 HTML은 `<br>`만 표시한다. 원본 HTML·링크·이미지는 실행하지 않는다. 다운로드 Markdown이 변환기의 정확한 결과다.

웹사이트의 conversion.html은 복잡한 표 3개를 선별한다. 전체 원본 비교·변환 Markdown·검사 진단·한계·재현 명령은 conversion-full.html에 둔다. selected-cases.json은 변경하지 않은 변환 파일의 1부터 시작하는 줄 범위와 참고 PDF의 영역(1600px 렌더 기준)을 지정한다. 영역 PNG는 해당 좌표로 PDF를 직접 렌더한 발췌다. 일부 사례는 진단이 없으며 이것을 검사 통과로 설명하지 않는다.
