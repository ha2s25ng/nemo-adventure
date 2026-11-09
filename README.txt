니모의 낯선 모험 | 고정 주소 배포 패키지 v5.1

[준비 완료] 현재 게임 코드 + 독립 에셋 100여 개 + 14종 신규 스킬 아이콘 + 업데이트 감지 코드
[아직 필요] 사용자의 GitHub 계정에서 저장소 생성 및 GitHub Pages 최초 설정, 또는 Cloudflare Pages 배포

GitHub Pages 배포 (추천: 고정 주소 + Git 커밋 시 자동 배포)
  1. GitHub에서 새로운 PUBLIC 저장소를 만들고 이 폴더 안의 파일을 루트에 업로드합니다.
     중요: `.github/workflows/deploy.yml`, `assets` 폴더도 포함하세요.
  2. 저장소 Settings > Pages > Build and deployment > Source > GitHub Actions 선택.
  3. Actions 성공 후 https://사용자명.github.io/저장소명/ 에서 실행됩니다.
  4. 이후 같은 저장소에 파일을 업데이트(커밋/push)하면 같은 주소로 자동 배포됩니다.

업데이트 규칙
  - `index.html`과 필요하면 `assets`를 변경합니다.
  - `version.json`의 version을 반드시 새 번호로 올리고, index.html의 `<meta name="nemo-version">` 및 스크립트 CURRENT도 같은 번호로 변경합니다.
  - 플레이 중엔 업데이트 안내만 띄우고, 시작 화면에서만 자동 새로고침합니다.
  - 실행 중인 판은 갑자기 중단되지 않습니다.
  - 웹주소는 동일하지만 파일:// 오프라인 HTML은 자동으로 업데이트되지 않습니다.
  - 첫 웹 접속 시 저장 데이터는 별도 저장소(도메인)에서 시작합니다. 예전 파일 설정 화면의 [저장 데이터 복사] -> 웹 게임의 [가져오기]를 사용하세요.
  - 온라인 랭킹은 기존처럼 별도의 Supabase 프로젝트 연결이 있어야 여러 PC 간 공유됩니다.

배포 전에: 이 웹 사이트는 공개 저장소에 배포되므로 비밀번호/개인정보/비밀 키를 삽입하지 마세요.

고정 실행 HTML: Nemo_Always_This_File.html에서 게시된 고정 게임 주소를 한 번 등록하세요.
