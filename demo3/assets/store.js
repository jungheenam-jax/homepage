/* 데모용 게시물 저장소
   실제 서비스에서는 이 부분만 서버(DB)로 바꾸면 됩니다.
   지금은 브라우저(localStorage)에 저장하므로, 같은 PC·같은 브라우저에서만 보입니다. */
(function () {
  var KEY = 'office-demo2-posts-v1';

  var SEED = [
    {
      id: 'p3', category: '행정심판', date: '2026-11-18',
      title: '영업정지 처분을 받았다면, 청구 기간과 집행정지부터 확인하세요',
      body: '행정심판은 처분이 있음을 안 날부터 90일, 처분이 있었던 날부터 180일 안에 청구해야 합니다.\n\n심판 결과가 나오기 전에 처분이 집행되어 회복하기 어려운 손해가 생길 것 같다면, 집행정지 신청을 함께 검토합니다.\n\n처분서, 사업자등록증, 처분 경위를 정리한 메모를 준비해 오시면 상담이 빨라집니다.'
    },
    {
      id: 'p2', category: '비영리법인', date: '2026-11-10',
      title: '사단법인 설립, 어떤 순서로 진행될까요',
      body: '비영리 사단법인은 대략 발기인 모집, 정관 작성, 창립총회, 주무관청 허가 신청, 설립등기 순서로 진행됩니다.\n\n가장 시간이 걸리는 단계는 주무관청 허가입니다. 목적 사업이 어느 부처 소관인지에 따라 준비 서류와 심사 기준이 달라지므로, 정관을 쓰기 전에 주무관청부터 확인하는 것이 좋습니다.'
    },
    {
      id: 'p1', category: '외국인고용', date: '2026-11-01',
      title: 'E-7 비자, 고용추천서가 필요한 경우',
      body: 'E-7(특정활동) 비자는 직종에 따라 관계 부처의 고용추천서를 먼저 받아야 하는 경우가 있습니다.\n\n추천서가 필요한지, 어느 기관에서 받는지는 직종 코드에 따라 달라집니다. 채용 계획이 정해지면 직무 내용과 함께 문의해 주세요.'
    }
  ];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return SEED.slice();
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function sorted(list) {
    return list.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id); });
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* 사이트 문구 (관리자에서 수정) */
  var SKEY = 'office-demo2-site-v1';
  var SITE_DEFAULT = {
    phone: '02-000-0000', mobile: '010-0000-0000', kakao: '@백현행정사', email: 'office@example.com',
    address: '서울특별시 강남구 ○○로 00, 0층', hours: '평일 09:00 – 18:00 · 토요일 예약 상담',
    heroTitle: '막힌 행정 절차,\n끝까지 해결합니다',
    heroSub: '법인설립 · 행정심판 · 인허가 · 외국인 고용 서류 작성과 접수 대행. 대표 행정사 직접 상담.',
    ceoName: '백재우',
    ceoIntro: '상담, 서류 작성, 기관 접수, 결과 안내까지 대표 행정사가 직접 진행합니다. 업무 범위와 수수료는 계약 전 확정합니다.'
  };
  window.SiteStore = {
    fields: [
      ['heroTitle', '첫 화면 큰 제목', 'area'], ['heroSub', '첫 화면 설명', 'area'],
      ['phone', '대표 전화'], ['mobile', '휴대폰'], ['kakao', '카카오톡 채널'], ['email', '이메일'],
      ['address', '주소'], ['hours', '운영시간'], ['ceoName', '대표 행정사 이름'], ['ceoIntro', '행정사 소개 문단', 'area']
    ],
    get: function () {
      var v = {};
      try { v = JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) {}
      return Object.assign({}, SITE_DEFAULT, v);
    },
    save: function (v) { try { localStorage.setItem(SKEY, JSON.stringify(v)); } catch (e) {} },
    reset: function () { try { localStorage.removeItem(SKEY); } catch (e) {} }
  };

  /* 블로그 동기화 데모: 실제로는 서버가 네이버 블로그 RSS를 주기적으로 읽어 옵니다 */
  var BLOG_SAMPLE = [
    { bid: 'b1', category: '공지', date: '2026-07-31', title: '백현 행정사사무소 브랜드 상표등록 완료', body: '네이버 블로그에서 옮겨 온 글입니다. 원문은 블로그에서 보실 수 있습니다.', link: 'https://blog.naver.com/baek-haeng' },
    { bid: 'b2', category: '외국인고용', date: '2026-06-12', title: '외국인고용추천서 발급, E-7 비자 절차와 필요서류', body: '네이버 블로그에서 옮겨 온 글입니다. 원문은 블로그에서 보실 수 있습니다.', link: 'https://blog.naver.com/baek-haeng' }
  ];

  window.PostStore = {
    categories: ['비영리법인', '행정심판', '인허가', '외국인고용', '기업인증', '공지'],
    all: function () { return sorted(load()); },
    get: function (id) { return load().filter(function (p) { return p.id === id; })[0] || null; },
    add: function (post) {
      var list = load();
      var item = { id: 'p' + Date.now(), category: post.category, title: post.title, body: post.body, date: today() };
      list.push(item); save(list); return item;
    },
    update: function (id, fields) {
      var list = load().map(function (p) { return p.id === id ? Object.assign({}, p, fields) : p; });
      save(list);
    },
    remove: function (id) { save(load().filter(function (p) { return p.id !== id; })); },
    reset: function () { try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '-sync'); } catch (e) {} },
    syncBlog: function () {
      var list = load(), added = 0;
      BLOG_SAMPLE.forEach(function (b) {
        if (list.some(function (p) { return p.bid === b.bid; })) return;
        list.push(Object.assign({ id: 'p' + b.bid, source: 'blog' }, b)); added++;
      });
      save(list);
      try { localStorage.setItem(KEY + '-sync', new Date().toISOString()); } catch (e) {}
      return added;
    },
    lastSync: function () { try { return localStorage.getItem(KEY + '-sync'); } catch (e) { return null; } },
    isNew: function (p) { return (Date.now() - new Date(p.date).getTime()) < 7 * 864e5; },
    esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    fmt: function (d) { return d.replace(/-/g, '.'); }
  };
})();
