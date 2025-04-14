const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db'); // db.js는 같은 backend 폴더 안에 있어야 함

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 정적 파일 서빙 (public 폴더)
app.use(express.static(path.join(__dirname, '../public')));

// ✅ 홈페이지 루트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 📦 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'festival-secret-key',
  resave: false,
  saveUninitialized: true
}));

// ✅ 회원가입
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

      req.session.userId = this.lastID;
      res.redirect('/');
    }
  );
});

// ✅ 로그인
app.post('/login', (req, res) => {
  const { student_id, password } = req.body;

  db.get('SELECT * FROM users WHERE student_id = ?', [student_id], async (err, user) => {
    if (err || !user) {
      return res.send('❌ 존재하지 않는 사용자입니다.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('❌ 비밀번호가 일치하지 않습니다.');

    req.session.userId = user.id;
    req.session.userName = user.name;
    res.redirect('/');
  });
});

// ✅ 예약
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

// ✅ 로그인한 사용자 정보 반환
app.get('/user-info', (req, res) => {
  if (req.session.userId && req.session.userName) {
    res.json({ loggedIn: true, name: req.session.userName });
  } else {
    res.json({ loggedIn: false });
  }
});

// ✅ 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});