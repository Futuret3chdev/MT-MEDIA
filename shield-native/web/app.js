const native = window.shieldNative || null;
document.getElementById('plat').textContent = (native && native.platform) || navigator.platform || 'web';

document.querySelectorAll('nav button').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('nav button').forEach((x) => x.classList.remove('on'));
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    document.getElementById(b.dataset.tab).classList.add('on');
  };
});

function renderIfaces(list) {
  const ul = document.getElementById('ifaces');
  ul.innerHTML = '';
  (list || []).forEach((row) => {
    const li = document.createElement('li');
    const note = /utun|awdl/i.test(row.name || '') ? ' · this Mac (not another phone)' : '';
    li.textContent = `${row.name || 'iface'} · ${(row.addrs || []).join(', ') || 'no ipv4'}${note}`;
    ul.appendChild(li);
  });
  if (!list || !list.length) {
    ul.innerHTML = '<li>No native scan on this build. Open on the desktop app for local interfaces.</li>';
  }
}

async function scan() {
  if (native && native.scan) {
    renderIfaces(await native.scan());
    return;
  }
  renderIfaces([]);
}
document.getElementById('scan').onclick = scan;
scan();

document.getElementById('panicBtn').onclick = async () => {
  const log = document.getElementById('panicLog');
  if (native && native.panic) {
    log.textContent = await native.panic();
    return;
  }
  log.textContent = 'On the desktop app this disables sharing listeners on this device. Phone companion: turn off sharing in system Settings.';
};

const GUIDE = {
  everyday: 'Keep sharing off when you do not need it. utun/awdl are this computer. One scan a day on Free.',
  elevated: 'Lock AirDrop/SSH. Watch new login items. Export evidence if something feels off.',
  stalking: 'Panic lock this device. Preserve evidence. Contact local emergency services if you are in danger. Shield cannot catch a person and will not hack back.',
  child: 'Guardian link stays visible. Child can unlink. Location share is off unless you turn it on.',
};
const level = document.getElementById('level');
const guideOut = document.getElementById('guideOut');
function paintGuide() { guideOut.textContent = GUIDE[level.value] || GUIDE.everyday; }
level.onchange = paintGuide;
paintGuide();

fetch('https://memetorrent.futuret3ch.com.au/api/portal/me', { credentials: 'include' })
  .then((r) => r.json())
  .then((d) => {
    document.getElementById('who').textContent = d?.ok && d.user
      ? 'Signed in as @' + d.user.username
      : 'Not signed in on this device.';
  })
  .catch(() => {
    document.getElementById('who').textContent = 'Sign in on the hub to attach this device.';
  });
