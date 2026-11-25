const accounts = [
  { id: 'a', name: 'Cửa hàng mẫu A', need: 'Thanh toán tại quầy', days: -1, prices: [490000, 790000, 1190000], next: 'Gửi phương án thanh toán tại quầy.' },
  { id: 'b', name: 'Văn phòng mẫu B', need: 'Gia hạn chữ ký số', days: 0, prices: [750000, 1050000, 1490000], next: 'Gửi các phương án gia hạn để khách chọn.' },
  { id: 'c', name: 'Trung tâm mẫu C', need: 'Hóa đơn điện tử', days: 2, prices: [320000, 620000, 980000], next: 'So sánh các gói theo số lượng hóa đơn.' },
  { id: 'd', name: 'Cửa hàng mẫu D', need: 'Kết nối Internet', days: 7, prices: [210000, 310000, 460000], next: 'Chuẩn bị phương án đường truyền.' }
];
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const sales = document.querySelector('#sales-demo');
const filterButtons = [...sales.querySelectorAll('[data-sales-filter]')];
const accountButtons = [...sales.querySelectorAll('[data-account]')];
const options = [...sales.querySelectorAll('[data-plan]')];
const fields = Object.fromEntries(['count', 'empty', 'detail', 'need', 'account', 'timing', 'next', 'total', 'submit', 'reset', 'feedback'].map(name => [name, document.getElementById('sales-' + name)]));
const completed = new Set();
const selectedPlans = new Map();
let active = accounts[0];
let filter = 'all';

function needsAction(account) {
  return account.days <= 2 && !completed.has(account.id);
}

function timing(account) {
  if (completed.has(account.id)) return 'Đã chuẩn bị báo giá';
  if (account.days < 0) return 'Quá hạn ' + Math.abs(account.days) + ' ngày';
  if (account.days === 0) return 'Đến hạn hôm nay';
  return 'Còn ' + account.days + ' ngày';
}

function render() {
  const shown = filter === 'due' ? accounts.filter(needsAction) : accounts;
  if (!shown.includes(active)) active = shown[0];
  fields.count.textContent = accounts.length + ' khách mẫu · ' + accounts.filter(needsAction).length + ' cần xử lý';
  fields.empty.hidden = shown.length > 0;
  fields.detail.hidden = !active;
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.salesFilter === filter)));
  accountButtons.forEach((button, index) => {
    const account = accounts[index];
    button.closest('li').hidden = !shown.includes(account);
    button.setAttribute('aria-pressed', String(active === account));
    button.querySelector('span').textContent = timing(account);
  });
  if (!active) return;

  const done = completed.has(active.id);
  const plan = selectedPlans.get(active.id) ?? 0;
  fields.need.textContent = active.need;
  fields.account.textContent = active.name;
  fields.timing.textContent = timing(active);
  fields.next.textContent = done ? 'Bước tiếp theo · Gửi phương án đã chọn và hẹn phản hồi.' : 'Bước tiếp theo · ' + active.next;
  options.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === plan));
    button.querySelector('strong').textContent = currency.format(active.prices[index]);
    button.disabled = done;
  });
  fields.total.textContent = currency.format(active.prices[plan]);
  fields.submit.disabled = done;
  fields.submit.textContent = done ? 'Đã chuẩn bị báo giá ✓' : 'Ghi nhận đã chuẩn bị báo giá ✓';
}

filterButtons.forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.salesFilter;
  fields.feedback.textContent = '';
  render();
}));

accountButtons.forEach((button, index) => button.addEventListener('click', () => {
  active = accounts[index];
  fields.feedback.textContent = '';
  render();
}));

options.forEach((button, index) => button.addEventListener('click', () => {
  selectedPlans.set(active.id, index);
  render();
}));

fields.submit.addEventListener('click', () => {
  const name = active.name;
  completed.add(active.id);
  render();
  fields.feedback.textContent = name + ' · Đã chuẩn bị báo giá. Tiếp theo: gửi phương án và hẹn phản hồi.';
  fields.feedback.focus({ preventScroll: true });
});

fields.reset.addEventListener('click', () => {
  completed.clear();
  selectedPlans.clear();
  active = accounts[0];
  filter = 'all';
  render();
  fields.feedback.textContent = 'Đã khôi phục dữ liệu mẫu.';
});

render();
