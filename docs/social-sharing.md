# SNS 공유 이미지

제품 페이지: https://roboco.io/aidocready/

썸네일 다운로드: https://roboco.io/aidocready/assets/social/ai-doc-ready-v1.png

공유 카드는 `site/assets/social/ai-doc-ready-v1.png`이며, 크기는 1732 × 908 px입니다. imagegen으로 제작한 제품 홍보 이미지입니다. 제품명, 목적에 맞는 문서 형식 선택, 제품 URL을 표시합니다. 실측 성능이나 공식 인증을 주장하지 않습니다.

`site/social.json`에서 이미지 경로, 크기, 대체 설명을 관리합니다. 사이트 빌더가 모든 HTML 페이지에 Open Graph와 Twitter Card 정보를 넣고 PNG의 실제 크기를 확인합니다. 이미지를 바꾸면 새 파일명으로 저장하고 설정을 갱신해 SNS 캐시와 구분합니다. 기존 공유 링크의 이미지는 보존합니다.

검증: `npm run check:site`와 `npm run check:site-release`. 배포 후 이미지 URL과 소개 페이지의 메타데이터를 확인합니다. SNS 서비스의 기존 링크 미리보기는 캐시 갱신 후 바뀔 수 있습니다.
