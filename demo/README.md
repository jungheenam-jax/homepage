# 홈페이지 데모 (컨셉: 한 장의 서류가 완성되는 과정)

## 여는 법
`index.html`을 더블클릭하면 크롬이나 엣지에서 바로 열립니다. 인터넷이 연결되어 있어야 글꼴이 제대로 보입니다.

## 페이지
- `index.html` 메인
- `board.html` 소식 게시판
- `post.html` 글 보기
- `admin.html` 관리자 (데모 비밀번호 `1234`)

관리자에서 올린 글은 이 브라우저(localStorage)에만 저장되는 데모입니다. 실제 서비스로 옮길 때 `assets/store.js`만 서버 저장 방식으로 바꾸면 됩니다.

## 효과
- 업무분야: 스크롤하면 오른쪽 서류가 그 업무의 서류로 타이핑되고 도장이 찍힘
- 진행절차: 세로 스크롤이 가로 이동으로 바뀌고 단계마다 도장
- 일하는 방식: 먹이 번지듯 단어가 선명해짐
- 첫 화면, 등장 효과, 상단 진행 막대: CSS 스크롤 연동 애니메이션(animation-timeline)
- 부드러운 스크롤: Lenis (assets/vendor, MIT)

디자인 점검에는 unslop 스킬(Damir Sokolovsky, CC BY 4.0)을 사용했습니다. 스킬은 저장소의 `.claude/skills/unslop`에 있어 이 폴더에서 Claude Code를 쓰면 자동으로 쓸 수 있습니다.
