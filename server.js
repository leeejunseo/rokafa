const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./db'); // db.js는 따로 있어야 합니다

const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'festival-secret-key',
  resave: false,
  saveUninitialized: true
}));

// 회원가입
app.post('/register', async (req, res) => {
  const { name, student_id, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run(`INSERT INTO users (name, student_id, password) VALUES (?, ?, ?)`,
    [name, student_id, hash],
    function (err) {
      if (err) {
        console.error('회원가입 오류:', err);
        return res.send('❗ 이미 가입된 교번이거나 서버 오류입니다.');
      }

      // 자동 로그인은 유지하되, 예약 페이지 대신 홈페이지로 리디렉션
      req.session.userId = this.lastID;
      res.redirect('/');  // ← 여기에서 reserve.html 대신 홈페이지로!
    }
  );
});

// 로그인
app.post('/login', (req, res) => {
  const { student_id, password } = req.body;

  db.get('SELECT * FROM users WHERE student_id = ?', [student_id], async (err, user) => {
    if (err || !user) {
      return res.send('❌ 존재하지 않는 사용자입니다.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('❌ 비밀번호가 일치하지 않습니다.');

    req.session.userId = user.id;
    req.session.userName = user.name;  // 💡 사용자 이름 저장
    res.redirect('/');  // ✅ 홈페이지로 리다이렉트
  });
});


// 예약
app.post('/reserve', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('❗ 로그인 후 이용해주세요.');
  }

  const { booth, people, time } = req.body;
  db.run(
    'INSERT INTO reservations (user_id, booth, people, time) VALUES (?, ?, ?, ?)',
    [req.session.userId, booth, people, time],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('❌ 예약 실패');
      }
      res.send('🎉 예약이 완료되었습니다!');
    }
  );
});

// 로그인한 사용자 정보 반환 API
app.get('/user-info', (req, res) => {
  if (req.session.userId && req.session.userName) {
    res.json({ loggedIn: true, name: req.session.userName });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});


// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
