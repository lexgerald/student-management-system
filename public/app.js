// No inline handlers anywhere: Helmet's default Content-Security-Policy blocks them.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let me = null;
try { me = JSON.parse(localStorage.getItem('sms')); } catch { /* not logged in */ }
const S = { view: '', course: '', q: '', reg: false, date: new Date().toISOString().slice(0, 10) };

const NAV = {
  admin: [['students', 'Students'], ['teachers', 'Teachers'], ['courses', 'Courses'], ['enrollments', 'Enrollments']],
  teacher: [['grades', 'Grades'], ['attendance', 'Attendance']],
  student: [['mycourses', 'My courses'], ['mygrades', 'My grades'], ['myattendance', 'My attendance']],
};

// ---------- helpers ----------
let timer;
function toast(msg, bad) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (bad ? ' err' : '');
  clearTimeout(timer);
  timer = setTimeout(() => (t.className = ''), 3500);
}

async function api(path, method = 'GET', body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(me && { Authorization: 'Bearer ' + me.token }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && me) { logout(); throw new Error('Session expired. Please log in again.'); }
  if (!res.ok) throw new Error(data.errors ? data.errors.join(', ') : data.message || 'Something went wrong');
  return data;
}

const field = (n, l, t = 'text', x = '') => `<label>${l}<input name="${n}" type="${t}" ${x}></label>`;
const empty = (m) => `<p class="muted">${m}</p>`;
const del = (path) => `<button class="danger sm" data-del="${path}">Delete</button>`;
const sel = (arr, val, label, cur) => arr.map((o) => `<option value="${o[val]}" ${o[val] === cur ? 'selected' : ''}>${esc(label(o))}</option>`).join('');
const tbl = (head, rows) => rows.length
  ? `<div class="scroll"><table><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`
  : empty('Nothing here yet.');
const addForm = (post, fields, label) => `<form class="card grid" data-form="save" data-post="${post}">${fields}<button>${label}</button></form>`;

async function myCourses() {
  const cs = await api('/courses/my');
  if (!cs.some((c) => c._id === S.course)) S.course = cs[0]?._id || '';
  return cs;
}
const picker = (cs) => `<label>Course<select data-pick="course">${sel(cs, '_id', (c) => `${c.code} · ${c.name}`, S.course)}</select></label>`;

// ---------- views ----------
const V = {
  async students() {
    const d = await api('/students?limit=100' + (S.q ? '&search=' + encodeURIComponent(S.q) : ''));
    return `<h2>Students</h2>
      ${addForm('/students', field('name', 'Name', 'text', 'required') + field('email', 'Email', 'email', 'required') + field('password', 'Password (8+ chars, letter and number)', 'password', 'required') + field('studentId', 'Student ID', 'text', 'required') + field('className', 'Class'), 'Add student')}
      <form class="row" data-form="search"><input name="q" placeholder="Search by name or ID" value="${esc(S.q)}"><button class="ghost">Search</button></form>
      ${tbl(['ID', 'Name', 'Email', 'Class', ''], d.students.map((s) => [esc(s.studentId), esc(s.user?.name), esc(s.user?.email), esc(s.className), del('/students/' + s._id)]))}`;
  },

  async teachers() {
    const d = await api('/teachers?limit=100');
    return `<h2>Teachers</h2>
      ${addForm('/teachers', field('name', 'Name', 'text', 'required') + field('email', 'Email', 'email', 'required') + field('password', 'Password (8+ chars, letter and number)', 'password', 'required') + field('teacherId', 'Teacher ID', 'text', 'required') + field('department', 'Department'), 'Add teacher')}
      ${tbl(['ID', 'Name', 'Email', 'Department', ''], d.teachers.map((t) => [esc(t.teacherId), esc(t.user?.name), esc(t.user?.email), esc(t.department), del('/teachers/' + t._id)]))}`;
  },

  async courses() {
    const [c, t] = await Promise.all([api('/courses?limit=100'), api('/teachers?limit=100')]);
    const assign = (x) => `<select data-assign="${x._id}"><option value="">Unassigned</option>${sel(t.teachers, '_id', (o) => o.user?.name, x.teacher?._id)}</select>`;
    return `<h2>Courses</h2>
      ${addForm('/courses', field('name', 'Course name', 'text', 'required') + field('code', 'Code', 'text', 'required') + field('credits', 'Credits', 'number', 'min="1" max="10" value="3"'), 'Add course')}
      ${tbl(['Code', 'Name', 'Credits', 'Teacher', ''], c.courses.map((x) => [esc(x.code), esc(x.name), x.credits, assign(x), del('/courses/' + x._id)]))}`;
  },

  async enrollments() {
    const [s, c, e] = await Promise.all([api('/students?limit=100'), api('/courses?limit=100'), api('/enrollments')]);
    const form = `<form class="card grid" data-form="save" data-post="/enrollments">
      <label>Student<select name="student" required>${sel(s.students, '_id', (x) => `${x.studentId} · ${x.user?.name}`)}</select></label>
      <label>Course<select name="course" required>${sel(c.courses, '_id', (x) => `${x.code} · ${x.name}`)}</select></label>
      ${field('academicYear', 'Academic year', 'text', `value="${new Date().getFullYear()}" required`)}
      <button>Enroll student</button></form>`;
    return `<h2>Enrollments</h2>${form}${tbl(['Student', 'Course', 'Year', ''], e.enrollments.map((x) => [esc(`${x.student?.studentId} · ${x.student?.user?.name}`), esc(`${x.course?.code} · ${x.course?.name}`), esc(x.academicYear), del('/enrollments/' + x._id)]))}`;
  },

  async grades() {
    const cs = await myCourses();
    if (!cs.length) return `<h2>Grades</h2>${empty('No courses are assigned to you yet. Ask an admin to assign one.')}`;
    const [en, g] = await Promise.all([api(`/courses/${S.course}/students`), api('/grades?course=' + S.course)]);
    const students = en.enrollments.map((x) => x.student);
    const form = students.length
      ? `<form class="card grid" data-form="save" data-post="/grades"><input type="hidden" name="course" value="${S.course}">
          <label>Student<select name="student" required>${sel(students, '_id', (x) => `${x.studentId} · ${x.user?.name}`)}</select></label>
          ${field('term', 'Term', 'text', 'placeholder="Term 1" required')}${field('score', 'Score (0-100)', 'number', 'min="0" max="100" step="any" required')}${field('remarks', 'Remarks')}
          <button>Save grade</button></form>`
      : empty('No students are enrolled in this course yet.');
    return `<h2>Grades</h2><div class="row">${picker(cs)}</div>${form}
      ${tbl(['Student', 'Term', 'Score', 'Remarks', ''], g.grades.map((x) => [esc(x.student?.user?.name), esc(x.term), x.score, esc(x.remarks), del('/grades/' + x._id)]))}`;
  },

  async attendance() {
    const cs = await myCourses();
    if (!cs.length) return `<h2>Attendance</h2>${empty('No courses are assigned to you yet. Ask an admin to assign one.')}`;
    const [en, at] = await Promise.all([api(`/courses/${S.course}/students`), api(`/attendance?course=${S.course}&date=${S.date}`)]);
    const current = {};
    at.records.forEach((r) => (current[r.student._id] = r.status));
    const status = (id) => ['present', 'absent', 'late', 'excused'].map((s) => `<option ${current[id] === s ? 'selected' : ''}>${s}</option>`).join('');
    const rows = en.enrollments.map((x) => [esc(x.student.studentId), esc(x.student.user?.name), `<select data-s="${x.student._id}">${status(x.student._id)}</select>`]);
    return `<h2>Attendance</h2>
      <div class="row">${picker(cs)}<label>Date<input type="date" value="${S.date}" data-pick="date"></label></div>
      <form data-form="attendance">${tbl(['ID', 'Student', 'Status'], rows)}${rows.length ? '<p><button>Save attendance</button></p>' : ''}</form>`;
  },

  async mycourses() {
    const d = await api('/enrollments/my');
    return `<h2>My courses</h2>${tbl(['Code', 'Course', 'Credits', 'Teacher', 'Year'], d.enrollments.map((x) => [esc(x.course?.code), esc(x.course?.name), x.course?.credits, esc(x.course?.teacher?.user?.name || 'Not assigned'), esc(x.academicYear)]))}`;
  },

  async mygrades() {
    const d = await api('/grades/my');
    return `<h2>My grades</h2><div class="card"><span class="muted">Average score</span><div class="stat">${d.average ?? '–'}</div></div>
      ${tbl(['Course', 'Term', 'Score', 'Grade', 'Remarks'], d.grades.map((x) => [esc(`${x.course?.code} · ${x.course?.name}`), esc(x.term), x.score, `<strong>${x.letter}</strong>`, esc(x.remarks)]))}`;
  },

  async myattendance() {
    const d = await api('/attendance/my');
    const sum = Object.values(d.summary).map((s) => [esc(s.course), s.present, s.late, s.absent, s.excused, `<strong>${s.attendancePercent}%</strong>`]);
    return `<h2>My attendance</h2>${tbl(['Course', 'Present', 'Late', 'Absent', 'Excused', 'Attended'], sum)}
      <h3>Daily record</h3>${tbl(['Date', 'Course', 'Status'], d.records.map((r) => [r.date.slice(0, 10), esc(r.course?.name), esc(r.status)]))}`;
  },
};

// ---------- screens ----------
function authScreen() {
  $('#bar').hidden = true;
  const r = S.reg;
  $('#main').innerHTML = `<div class="auth"><h2>${r ? 'Create a student account' : 'Log in'}</h2>
    <form class="card" data-form="${r ? 'register' : 'login'}">
      ${r ? field('name', 'Full name', 'text', 'required placeholder="Enter your full name"') : ''}${field('email', 'Email', 'email', 'required placeholder="email@example.com"')}
      ${field('password', r ? 'Password (8+ chars, letter and number)' : 'Password', 'password', 'required placeholder="Enter your password"')}
      <button>${r ? 'Create account' : 'Log in'}</button>
      <button type="button" class="link" data-act="toggle">${r ? 'I already have an account' : 'New student? Create an account'}</button>
    </form></div>`;
}

async function show(view) {
  if (view) S.view = view;
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === S.view));
  try {
    $('#main').innerHTML = await V[S.view]();
  } catch (e) {
    toast(e.message, true);
    $('#main').innerHTML = empty('Could not load this page.');
  }
}

function start() {
  if (!me) return authScreen();
  const items = NAV[me.role];
  $('#bar').hidden = false;
  $('#nav').innerHTML = items.map(([k, l]) => `<button data-view="${k}">${l}</button>`).join('');
  $('#who').textContent = `${me.name} (${me.role})`;
  S.q = ''; S.course = '';
  show(items[0][0]);
}

function logout() {
  me = null;
  localStorage.removeItem('sms');
  start();
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-view],[data-act],[data-del]');
  if (!b) return;
  try {
    if (b.dataset.view) return show(b.dataset.view);
    if (b.dataset.act === 'logout') return logout();
    if (b.dataset.act === 'toggle') { S.reg = !S.reg; return authScreen(); }
    if (b.dataset.del && confirm('Delete this record? This cannot be undone.')) {
      await api(b.dataset.del, 'DELETE');
      toast('Deleted');
      show();
    }
  } catch (err) { toast(err.message, true); }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  try {
    if (t.dataset.pick && t.value) { S[t.dataset.pick] = t.value; show(); }
    if (t.dataset.assign) {
      await api(`/courses/${t.dataset.assign}/teacher`, 'PUT', { teacher: t.value || null });
      toast('Teacher updated');
    }
  } catch (err) { toast(err.message, true); }
});

document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const kind = f.dataset.form;
  const data = {};
  new FormData(f).forEach((v, k) => { if (v !== '') data[k] = f.elements[k].type === 'number' ? Number(v) : v; });
  try {
    if (kind === 'login' || kind === 'register') {
      me = await api('/auth/' + kind, 'POST', data);
      localStorage.setItem('sms', JSON.stringify(me));
      return start();
    }
    if (kind === 'search') { S.q = data.q || ''; return show(); }
    if (kind === 'attendance') {
      const records = [...f.querySelectorAll('[data-s]')].map((s) => ({ student: s.dataset.s, status: s.value }));
      await api('/attendance', 'POST', { course: S.course, date: S.date, records });
      return toast('Attendance saved');
    }
    await api(f.dataset.post, 'POST', data);
    toast('Saved');
    show();
  } catch (err) { toast(err.message, true); }
});

start();