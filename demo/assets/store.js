/* 데모용 게시물 저장소
   실제 서비스에서는 이 부분만 서버(DB)로 바꾸면 됩니다.
   지금은 브라우저(localStorage)에 저장하므로, 같은 PC·같은 브라우저에서만 보입니다. */
(function () {
  var KEY = 'office-demo-posts-v1';

  var SEED = [
    {
      id: 'p3', category: '안내', date: '2026-11-18',
      title: '영업정지 처분을 받았다면, 행정심판 청구 기간부터 확인하세요',
      body: '영업정지나 허가취소 같은 처분에 대해서는 행정심판을 청구할 수 있습니다.\n\n청구 기간은 처분이 있음을 안 날부터 90일, 처분이 있었던 날부터 180일 이내입니다. 두 기간 중 하나라도 지나면 청구할 수 없으니, 처분서를 받으셨다면 날짜부터 확인해 주세요.\n\n처분서, 사업자등록증, 처분 경위를 정리한 메모를 준비해 오시면 상담이 빨라집니다.'
    },
    {
      id: 'p2', category: '출입국', date: '2026-11-10',
      title: '체류기간 연장, 만료일 전에 미리 준비해야 하는 이유',
      body: '체류기간 연장은 만료일 전에 신청해야 합니다. 기한을 넘기면 범칙금이 부과되거나 이후 체류 심사에서 불리해질 수 있습니다.\n\n체류자격마다 필요한 서류가 다르기 때문에, 만료일 한두 달 전에는 상담을 받아 보시길 권합니다.'
    },
    {
      id: 'p1', category: '공지', date: '2026-11-01',
      title: '홈페이지를 새로 열었습니다',
      body: '앞으로 이곳에 업무 안내와 자주 받는 질문에 대한 답을 정리해 올리겠습니다.\n\n상담은 전화나 카카오톡으로 편하게 문의해 주세요.'
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

  window.PostStore = {
    categories: ['공지', '안내', '출입국', '인허가', '사례'],
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
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    isNew: function (p) { return (Date.now() - new Date(p.date).getTime()) < 7 * 864e5; },
    esc: function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    fmt: function (d) { return d.replace(/-/g, '.'); }
  };
})();
