# 제품과 웹사이트 변경 기준

공개 사이트 https://roboco.io/aidocready/ 는 제품 개선과 같은 변경 묶음에서 검토한다. 작업 정본은 저장소 루트 AGENTS.md이며 Claude Code는 CLAUDE.md에서 이를 참조한다. pi 주간 대응은 시스템 프롬프트에 같은 기준을 명시한다.

## 영향 기록

제품 또는 공개 웹사이트가 바뀌면 docs/site-impact.json을 수정한다. CI는 변경 파일과 package.json의 제품 관련 필드를 비교하고, 새 영향 기록이 없으면 실패한다. 테스트만 바꾸거나 npm 작업 스크립트만 바꾸는 경우에는 홍보 문서 변경을 강제하지 않는다.

기록의 status는 다음 중 하나다.

- updated: 영향을 받는 공개 페이지와 함께 수정했다. areas에는 landing/manual/faq/press 중 해당 부분을 적는다. 선언한 영역의 소스 변경이 있어야 한다.
- pending-release: 아직 npm에 공개하지 않은 기능이다. 영향을 받는 문서 초안을 docs/site-drafts/에 저장하고 draftPath를 적는다. 공개 사이트는 마지막 공개 버전을 유지한다.
- no-public-impact: 호환성 내부 수정처럼 사용자에게 설명하는 내용이 동일하다. areas는 빈 배열이고 summary에 구체적인 근거를 적는다. 버전 변경 또는 공개 웹 소스 변경에는 이 상태를 사용할 수 없다.

publicVersion은 site/product.json의 version과 일치해야 한다. 같은 변경 묶음에서 기록 파일이 실제로 바뀌어야 한다. 이 검사는 검토 누락을 발견하는 장치이며 글의 정확성을 자동으로 보증하지는 않는다.

```json
{
  "status": "pending-release",
  "publicVersion": "0.2.0",
  "areas": ["manual", "faq", "press"],
  "summary": "새 입력 옵션은 미출시이며 매뉴얼과 FAQ의 초안을 준비했습니다.",
  "draftPath": "docs/site-drafts/next-input-option.md"
}
```

## 검증과 배포

npm run check:site는 Git 기준점과 변경 내용을 비교하고, 사이트를 빌드해 내부 링크·앵커·다운로드를 확인한다. PR은 base SHA, main 푸시는 이전 SHA를 CI 기준점으로 사용한다. 로컬 기본 기준은 HEAD의 부모이며, 넓은 변경 묶음은 --base에 Git의 전체 SHA를 지정한다.

npm run check:site-release는 npm latest를 읽고 공개 웹 버전과 gitHead/releaseRef를 비교한다. 새 npm 릴리스 뒤에도 이전 버전만 안내하면 검증에 실패한다. 개발 버전을 공개 제품처럼 표시하거나, 실제 배포본과 다른 커밋에서 다운로드를 만들면 Pages 배포가 실패한다. npm의 게시 처리가 끝나기 전에는 검증에 실패할 수 있으므로 공개 여부를 확인한 뒤 재실행한다.

GitHub Release published 이벤트도 검사와 Pages 배포를 실행한다. npm 게시 후 GitHub Release를 만들지 않는 경우에는 사이트 변경을 푸시하거나 워크플로를 수동 실행한다.

Pages는 site뿐 아니라 src·프로파일·스킬·예제·제품 문서·package.json·CHANGELOG 변경에도 실행한다. 하지만 페이지 내용을 임의로 생성하지는 않는다. 영향 기록과 사람이 확인한 웹 문서가 준비되고, 공개 릴리스 검증까지 통과하면 기존 Actions가 자동으로 배포한다.

릴리스 후에는 실제 변환 사례를 포함한 사이트의 모든 페이지, 인쇄/다운로드, 버전이 고정된 명령과 실제 결과를 확인한다. 사이트의 공개 버전은 개발 중인 package.json 버전과 달라도 된다. 검사 수치는 해당 공개 릴리스의 검증 기록을 기준으로 관리한다.

`pending-release` 변경에는 공개 웹페이지 수정을 포함할 수 없습니다. 주간 Kordoc 대응도 후보 패치에 `check:site`를 실행한 뒤 PR을 만듭니다.
