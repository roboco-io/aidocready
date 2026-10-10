# 규칙 근거와 검사 해석

출처: 행정안전부 혁신행정담당관, 2026-08-24 보도자료 「복잡한 표·그림 대신 고품질 텍스트로 행안부, 인공지능(AI) 친화적 보고서 전면 도입」.
공식 게시문: https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940
공식 PDF: https://mois.go.kr/cmm/fms/FileDown.do?atchFileId=FILE_001483394PMYHx-&fileSn=1
확인일: 2026-10-10. 공식 게시문 PDF의 3쪽 전체를 시각 확인했습니다. 이후 사용자가 제공한 Downloads 첨부본도 확인했으며 공식 PDF와 바이트 동일합니다. SHA-256: 8ec0514e99444ba3e18651d1a93adaa424a3eeeb890cf95ccadef8e157ab09b0. 공공누리 제1유형 출처표시.

## 공식 원칙 (PDF 2쪽)

- 표·그림 상단에 제목을 표기하고 번호 등으로 순서를 표시합니다.
- 셀을 단순하게 병합합니다.
- 문장을 서술식으로 작성합니다.
- 항목 표시를 표준화합니다. 제시된 표기는 Ⅰ., 1., 가., 1), 가)입니다.
- 불필요한 시각적 꾸미기를 지양합니다.

PDF 1쪽은 시범운영에서 표 안의 표 등 복잡한 양식을 지양했다고 설명합니다. 중첩 표 검사는 이 설명에 근거하며, 2쪽의 간소화된 핵심 원칙 목록과 구분합니다. 3쪽은 작성 전후 예시이며 단순 병합이 남아 있습니다. 표 삭제나 모든 병합 금지를 요구하지 않습니다.

## aidocready의 검사 해석

| 규칙 | 근거 | MVP 판단 방식 |
| --- | --- | --- |
| MOIS-TABLE-CAPTION / MOIS-FIGURE-CAPTION | 상단 제목 | 바로 앞 문단의 인식 가능한 제목. 다른 표기는 수동 확인 |
| MOIS-CAPTION-NUMBER | 번호 등으로 순서 표시 | 양의 정수만 자동 인식. 다른 순서 표시는 수동 확인 |
| MOIS-MERGE-REVIEW | 단순 병합 | 양방향 병합은 Suggestion. 공식 복잡도 임계값 없음 |
| MOIS-NESTED-TABLE | 시범운영 설명 | 셀·캡션 내부 표를 재귀 탐색 |
| MOIS-NUMBERING | 표준 항목 표시 | 알려진 단계 간 건너뛰기 탐지 |
| ADR-HEADING-LEVEL | 자체 보완 | 제목 단계 건너뛰기 Error |
| ADR-NUMBER-SEQUENCE / ADR-CAPTION-SEQUENCE | 자체 보완 | 중복·역행·누락 번호 Warning |
| ADR-CAPTION-POSITION | 자체 보완 | IR에 위치가 없는 내장 캡션 검토 Suggestion |
| ADR-INPUT-COVERAGE | 자체 보완 | 지원하지 않는 HTML 및 파서 경고 표시 |

`origin=mois`는 원칙의 근거가 공식 자료라는 뜻입니다. 검사 알고리즘·severity·ID·메시지는 모두 aidocready가 정한 운영 방식입니다. 공식 준수 판정은 아닙니다.

## 수동 검토와 사실 보존

문장 명확성, 서술식 작성, 꾸미기의 적절성은 정규식으로 확정하지 않습니다. 원문 수치·사실 보존은 별도의 원문 비교가 필요합니다. 예컨대 원문에 10억 원과 15억 원만 있으면 증가율이나 의미 해석을 추가하지 않습니다. 날짜·조건·단위·고유명사·주체·행위·결론을 원문과 대조하세요. 필요한 수정 근거가 없으면 추가 정보를 요청하세요.
