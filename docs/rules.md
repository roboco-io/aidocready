# AI Doc Ready 규칙

버전: 0.2.0. 이 규칙 ID·검사 문법·심각도는 프로젝트의 운영 방식이며 공식 인증 기준이 아닙니다.

## MOIS-TABLE-CAPTION

- 근거 구분: mois
- 기본 심각도: Warning
- 원칙: 표 상단에 제목 표기
- 검사 해석: 바로 앞 문단의 표 제목과 꺾쇠/괄호로 감싼 제목을 인식. 내장 캡션 위치는 별도 검토.
- 공식 자료: [행정안전부 보도자료](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)

## MOIS-FIGURE-CAPTION

- 근거 구분: mois
- 기본 심각도: Warning
- 원칙: 그림 상단에 제목 표기
- 검사 해석: 바로 앞 문단의 그림 제목과 꺾쇠/괄호로 감싼 제목을 인식.
- 공식 자료: [행정안전부 보도자료](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)

## MOIS-CAPTION-NUMBER

- 근거 구분: mois
- 기본 심각도: Warning
- 원칙: 번호 등으로 표·그림 순서 표시
- 검사 해석: 표/그림 + 양의 정수 표기를 인식. 다른 순서 표시는 사람이 검토.
- 공식 자료: [행정안전부 보도자료](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)

## MOIS-MERGE-REVIEW

- 근거 구분: mois
- 기본 심각도: Suggestion
- 원칙: 셀은 단순하게 병합
- 검사 해석: 행·열 양방향 병합을 검토 후보로 표시. 공식 복잡도 판정이나 병합 금지 아님.
- 공식 자료: [행정안전부 보도자료](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)

## MOIS-NESTED-TABLE

- 근거 구분: mois
- 기본 심각도: Warning
- 원칙: 시범운영에서 표 안의 표 등 복잡한 양식 지양
- 검사 해석: 셀 및 캡션 내부의 표를 탐색. 최신 핵심 원칙과 시범운영 설명을 구분.
- 공식 자료: [행정안전부 보도자료](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)

## MOIS-NUMBERING

- 근거 구분: mois
- 기본 심각도: Warning
- 원칙: 항목 표시 표준화
- 검사 해석: Ⅰ., 1., 가., 1), 가) 단계의 건너뛰기 탐지. 숫자 연속성은 자체 규칙.
- 공식 자료: [행정안전부 보도자료](https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940)

## ADR-HEADING-LEVEL

- 근거 구분: aidocready
- 기본 심각도: Error
- 원칙: 제목 계층 연속성
- 검사 해석: Markdown 제목 단계가 둘 이상 내려가면 오류.

## ADR-NUMBER-SEQUENCE

- 근거 구분: aidocready
- 기본 심각도: Warning
- 원칙: 같은 단계 번호 연속성
- 검사 해석: 같은 상위 항목 아래 번호 중복·역행·누락을 검사.

## ADR-CAPTION-SEQUENCE

- 근거 구분: aidocready
- 기본 심각도: Warning
- 원칙: 표·그림 번호 연속성
- 검사 해석: 표와 그림 각각 문서 읽기 순서대로 번호 검사.

## ADR-CAPTION-POSITION

- 근거 구분: aidocready
- 기본 심각도: Suggestion
- 원칙: 내장 캡션 위치 검토
- 검사 해석: Kordoc IR이 캡션 위/아래 위치를 노출하지 않으면 검토 요청.

## ADR-INPUT-COVERAGE

- 근거 구분: aidocready
- 기본 심각도: Warning
- 원칙: 검사 누락 표시
- 검사 해석: 지원하지 않는 HTML 구조를 발견하면 검사 불완전 표시.
