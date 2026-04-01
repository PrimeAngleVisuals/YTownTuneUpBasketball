/* ============================================================
   Y-TOWN TUNE UPS — JavaScript
   Live roster/schedule from LCAA · Email via Formspree
   ============================================================ */

// ── CONFIG ──────────────────────────────────────────────────
// 1. Go to https://formspree.io → sign up with tuneupsbasketball@gmail.com
// 2. Create a new form → copy the ID (e.g. "xbjnjkbq")
// 3. Replace YOUR_FORM_ID below with that ID
const FORMSPREE_ID = 'xnjoveav';

const TEAM_ID   = 962;
const LCAA_BASE = 'https://lcaabasketball.com/';
const PROXY     = 'https://api.allorigins.win/raw?url=';

// ── STATIC FALLBACK DATA ────────────────────────────────────
// Shown immediately while live data loads, also used if LCAA is unreachable
const FALLBACK_ROSTER = [
  { num: '0',  name: 'Cooper Phillips' },
  { num: '1',  name: 'Gavin LaGroux' },
  { num: '2',  name: 'Ridge Ewert' },
  { num: '3',  name: 'Lloyd Hunt' },
  { num: '4',  name: 'Elijah Ellinos' },
  { num: '6',  name: 'Zeke Rushwin' },
  { num: '7',  name: 'Jordan Steiginga' },
  { num: '13', name: 'Blake Ewert' },
  { num: '14', name: 'Jude Coffman' },
  { num: '17', name: 'Max Marino' },
  { num: '55', name: 'Kaleb Frenger' },
  { num: '99', name: 'Levi Woodward' },
  { num: '99', name: 'Caleb Dmyterko' },
  { num: '99', name: 'Colton Ewert' },
  { num: '99', name: 'Giorgio Marriano' },
  { num: '99', name: 'Caiden Johnson' },
  { num: '99', name: 'Riley Chrish' },
];

const FALLBACK_SCHEDULE = [
  { date: 'DEC 06', time: '12:00 PM', home: true,  opponent: 'BrickLayers',    scoreUs: 68, scoreThem: 47  },
  { date: 'DEC 07', time: '7:00 PM',  home: false, opponent: 'Mighty Deer',    scoreUs: 52, scoreThem: 72  },
  { date: 'DEC 13', time: '12:00 PM', home: true,  opponent: 'Water Wizz',     scoreUs: 71, scoreThem: 63  },
  { date: 'JAN 04', time: '4:00 PM',  home: false, opponent: 'Young Boys',     scoreUs: 77, scoreThem: 84  },
  { date: 'MAR 28', time: '6:00 PM',  home: false, opponent: 'Cookies N Cream',scoreUs: 85, scoreThem: 131 },
];

// ── RENDER: ROSTER ──────────────────────────────────────────
function renderRoster(players) {
  const grid = document.getElementById('rosterGrid');
  if (!grid || !players.length) return;

  grid.innerHTML = players.map(p => `
    <div class="player-card">
      <div class="player-number">${p.num}</div>
      <div class="player-info">
        <h3 class="player-name">${p.name}</h3>
        <p class="player-pos">Y-Town Tune Ups · 2025–26</p>
        <div class="player-stats">
          <div class="pstat"><span>JERSEY</span><strong>#${p.num}</strong></div>
        </div>
      </div>
    </div>
  `).join('');

  // Stagger reveal animation on newly rendered cards
  grid.querySelectorAll('.player-card').forEach((el, i) => {
    el.classList.add('reveal');
    setTimeout(() => el.classList.add('visible'), i * 55 + 80);
  });
}

// ── RENDER: SCHEDULE ────────────────────────────────────────
function renderSchedule(games) {
  const list = document.getElementById('scheduleList');
  if (!list || !games.length) return;

  let wins = 0, losses = 0;
  games.forEach(g => {
    if (g.scoreUs !== null && g.scoreThem !== null) {
      if (g.scoreUs > g.scoreThem) wins++;
      else if (g.scoreUs < g.scoreThem) losses++;
    }
  });

  list.innerHTML = games.map(g => {
    const hasScore  = g.scoreUs !== null && g.scoreThem !== null;
    const isWin     = hasScore && g.scoreUs > g.scoreThem;
    const isLoss    = hasScore && g.scoreUs < g.scoreThem;
    const isUpcoming = !hasScore;

    const parts     = g.date.trim().split(/\s+/);
    const month     = parts[0] || '—';
    const day       = parts[1] || '—';

    const statusClass = isWin ? 'win' : isLoss ? 'loss' : 'upcoming';
    const statusText  = isWin
      ? `W &nbsp;${g.scoreUs}–${g.scoreThem}`
      : isLoss
        ? `L &nbsp;${g.scoreUs}–${g.scoreThem}`
        : 'Upcoming';

    return `
      <div class="game-row ${isUpcoming ? 'game-row--upcoming' : ''}">
        <div class="game-date">
          <span class="g-month">${month}</span>
          <span class="g-day">${day}</span>
        </div>
        <div class="game-info">
          <span class="game-label ${g.home ? '' : 'away'}">${g.home ? 'HOME' : 'AWAY'}</span>
          <h4>Y-Town Tune Ups <span class="vs">vs.</span> ${g.opponent}</h4>
          <p>${g.time}${hasScore ? ` &nbsp;·&nbsp; <strong style="color:var(--cream)">${g.scoreUs} – ${g.scoreThem}</strong>` : ''}</p>
        </div>
        <div class="game-status ${statusClass}">${statusText}</div>
      </div>
    `;
  }).join('');

  // Update record display in the section eyebrow
  const recordEl = document.getElementById('seasonRecord');
  if (recordEl && (wins || losses)) {
    recordEl.textContent = `${wins}W – ${losses}L`;
  }
}

// ── LIVE FETCH FROM LCAA ─────────────────────────────────────
async function fetchLCAAData() {
  try {
    // Step 1: Fetch team page to extract the current season ID
    const teamUrl  = PROXY + encodeURIComponent(`${LCAA_BASE}team.php?id=${TEAM_ID}`);
    const teamRes  = await fetch(teamUrl, { signal: AbortSignal.timeout(9000) });
    const teamHtml = await teamRes.text();
    const teamDoc  = new DOMParser().parseFromString(teamHtml, 'text/html');

    const seasonId = extractSeasonId(teamDoc);
    if (!seasonId) throw new Error('Could not find season ID');

    // Step 2: Fetch schedule + roster simultaneously
    const scheduleUrl = PROXY + encodeURIComponent(
      `${LCAA_BASE}schedule_filter_team.php?season_id=${seasonId}&team_id=${TEAM_ID}`
    );
    const rosterUrl = PROXY + encodeURIComponent(
      `${LCAA_BASE}player_filter.php?season=${seasonId}&team_id=${TEAM_ID}`
    );

    const [scheduleRes, rosterRes] = await Promise.all([
      fetch(scheduleUrl, { signal: AbortSignal.timeout(9000) }),
      fetch(rosterUrl,   { signal: AbortSignal.timeout(9000) }),
    ]);

    const scheduleHtml = await scheduleRes.text();
    const rosterHtml   = await rosterRes.text();

    const liveSchedule = parseLCAASchedule(scheduleHtml);
    const liveRoster   = parseLCAAPlayers(rosterHtml);

    if (liveSchedule.length) {
      renderSchedule(liveSchedule);
      showLiveBadge('scheduleLiveBadge');
    }
    if (liveRoster.length) {
      renderRoster(liveRoster);
      showLiveBadge('rosterLiveBadge');
    }

  } catch (err) {
    console.warn('LCAA live data unavailable — showing last known data.', err.message);
  }
}

function extractSeasonId(doc) {
  // Look for season dropdown select elements
  for (const sel of doc.querySelectorAll('select')) {
    const selected = sel.querySelector('option[selected]');
    if (selected?.value) return selected.value;
    const first = sel.querySelector('option[value]');
    if (first?.value) return first.value;
  }
  // Fallback: look for teamSchedule(seasonId, ...) call in inline scripts
  for (const script of doc.querySelectorAll('script')) {
    const m = script.textContent.match(/teamSchedule\s*\(\s*(\d+)/);
    if (m) return m[1];
    const m2 = script.textContent.match(/roster\s*\(\s*(\d+)/);
    if (m2) return m2[1];
  }
  return null;
}

function parseLCAASchedule(html) {
  const doc   = new DOMParser().parseFromString(html, 'text/html');
  const games = [];

  doc.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 3) return;

    let date = '', time = '', home = true, opponent = '', scoreUs = null, scoreThem = null;

    // Find date/time cell — typically first cell
    const firstText = cells[0]?.textContent?.trim() || '';
    const dateMatch = firstText.match(/([A-Z]{3}\s+\d+)/i);
    const timeMatch = firstText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (dateMatch) date = dateMatch[1].toUpperCase();
    if (timeMatch) time = timeMatch[1];

    // Scan all cells for team links and scores
    cells.forEach(cell => {
      // Team name from anchor pointing to team.php
      cell.querySelectorAll('a[href*="team.php"]').forEach(a => {
        if (!a.href.includes('id=' + TEAM_ID)) {
          opponent = a.textContent.trim();
        }
      });

      // Score: look for bold numbers or a "X @ Y" / "X - Y" pattern
      const scoreM = cell.textContent.match(/(\d{2,3})\s*[@\-]\s*(\d{2,3})/);
      if (scoreM) {
        // Need to know which is ours — determine by checking if our team is home/away
        // The LCAA format: Away Score @ Home Score
        // We parse home/away from the @ symbol in cell innerHTML
        if (cell.innerHTML.includes('@')) {
          home = false;
          scoreUs   = parseInt(scoreM[1]);
          scoreThem = parseInt(scoreM[2]);
        } else {
          scoreUs   = parseInt(scoreM[1]);
          scoreThem = parseInt(scoreM[2]);
        }
      }

      // Detect away from cell text (@ sign not inside a URL)
      const cellText = cell.textContent;
      if (cellText.match(/^\s*@\s*/)) home = false;
    });

    if (date || opponent) {
      games.push({ date: date || '—', time: time || '—', home, opponent: opponent || 'TBD', scoreUs, scoreThem });
    }
  });

  return games;
}

function parseLCAAPlayers(html) {
  const doc     = new DOMParser().parseFromString(html, 'text/html');
  const players = [];
  const seen    = new Set();

  doc.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 2) return;

    let name = '', num = '—';

    // Player name: look for anchor linking to player.php
    const playerLink = row.querySelector('a[href*="player.php"]');
    if (playerLink) name = playerLink.textContent.trim();

    // Jersey number: short numeric cell
    cells.forEach(cell => {
      const t = cell.textContent.trim();
      if (/^\d{1,3}$/.test(t)) num = t;
    });

    if (name && !seen.has(name)) {
      seen.add(name);
      players.push({ name, num });
    }
  });

  return players;
}

function showLiveBadge(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'inline';
}

// ── NAVBAR SCROLL ────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── MOBILE NAV TOGGLE ────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── SCROLL REVEAL ────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const delay = parseInt(entry.target.dataset.delay || 0);
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.about-card, .jersey-showcase, .contact-grid, .about-quote').forEach((el, i) => {
  el.classList.add('reveal');
  el.dataset.delay = i * 80;
  revealObserver.observe(el);
});

// ── STATS BAR LOOP ───────────────────────────────────────────
const statsTrack = document.querySelector('.stats-track');
if (statsTrack) statsTrack.innerHTML += statsTrack.innerHTML;

// ── CONTACT FORM (Formspree) ─────────────────────────────────
const contactForm  = document.getElementById('contactForm');
const formStatus   = document.getElementById('formStatus');
const formSubmitBtn = document.getElementById('formSubmitBtn');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (FORMSPREE_ID === 'YOUR_FORM_ID') {
      formStatus.textContent = 'Email not configured yet — contact us at tuneupsbasketball@gmail.com';
      formStatus.className   = 'form-status form-status--error';
      return;
    }

    formSubmitBtn.disabled    = true;
    formSubmitBtn.textContent = 'Sending...';

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(contactForm),
      });

      if (res.ok) {
        formSubmitBtn.textContent  = 'Sent.';
        formStatus.textContent     = 'Message received. We\'ll be in touch.';
        formStatus.className       = 'form-status form-status--ok';
        contactForm.reset();
      } else {
        throw new Error('Server error');
      }
    } catch {
      formSubmitBtn.textContent = 'Send It';
      formSubmitBtn.disabled    = false;
      formStatus.textContent    = 'Something went wrong. Email us directly: tuneupsbasketball@gmail.com';
      formStatus.className      = 'form-status form-status--error';
    }
  });
}

// ── ACTIVE NAV HIGHLIGHT ─────────────────────────────────────
const navItems = document.querySelectorAll('.nav-links a');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navItems.forEach(a => a.style.color = '');
    const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
    if (active) active.style.color = 'var(--orange)';
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => navObserver.observe(s));

// ── BOOT ─────────────────────────────────────────────────────
renderRoster(FALLBACK_ROSTER);
renderSchedule(FALLBACK_SCHEDULE);
fetchLCAAData();
