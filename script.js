const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
const nextBtn = document.querySelector('.next-btn');
const logoBlock = document.querySelector('.logo-block');
const authFormBlock = document.querySelector('.auth-form-block');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const toLogin = document.getElementById('to-login');
const toRegister = document.getElementById('to-register');
const profileBlock = document.querySelector('.profile-block');
const profileGreeting = document.getElementById('profile-greeting');
const profileContinueBtn = document.querySelector('.profile-continue-btn');
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    indicators[i].classList.toggle('active', i === index);
  });
  if (index === slides.length - 1) {
    nextBtn.textContent = 'Начать';
  } else {
    nextBtn.textContent = 'Далее';
  }
}

nextBtn.addEventListener('click', () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  } else {
    document.querySelector('.slides').style.display = 'none';
    document.querySelector('.slide-indicators').style.display = 'none';
    logoBlock.style.display = 'none';
    authFormBlock.style.display = 'flex';
  }
});

if (toLogin && toRegister) {
  toLogin.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
  });
  toRegister.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  });
}

function getGreetingByTime() {
  // МСК
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const msk = new Date(utc + 3 * 3600000);
  const hour = msk.getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function showProfile(name, orders = 0) {
  if (authFormBlock) authFormBlock.style.display = 'none';
  if (profileBlock) profileBlock.style.display = 'flex';
  if (profileGreeting) profileGreeting.textContent = `${getGreetingByTime()}, ${name}!`;
  if (document.querySelector('.slides')) document.querySelector('.slides').style.display = 'none';
  if (document.querySelector('.slide-indicators')) document.querySelector('.slide-indicators').style.display = 'none';
  if (logoBlock) logoBlock.style.display = 'none';
  // Аватар — первая буква имени (без пробелов, в верхнем регистре)
  const avatar = document.getElementById('profile-avatar');
  if (avatar && name) {
    const firstLetter = name.trim().charAt(0).toUpperCase();
    avatar.textContent = firstLetter || 'A';
  }
  // Количество поездок
  const ordersEl = document.getElementById('profile-orders');
  if (ordersEl) ordersEl.textContent = orders;
}

// Firebase Auth + Firestore
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name || !phone || !password) return;
  try {
    const email = phone.replace(/\D/g, '') + '@prestige.taxi';
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await firebase.firestore().collection('users').doc(user.uid).set({ name, phone });
    showProfile(name);
  } catch (err) {
    alert('Ошибка регистрации: ' + err.message);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;
  if (!phone || !password) return;
  try {
    const email = phone.replace(/\D/g, '') + '@prestige.taxi';
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const doc = await firebase.firestore().collection('users').doc(user.uid).get();
    const name = doc.exists ? doc.data().name : '';
    showProfile(name || 'Клиент');
  } catch (err) {
    alert('Ошибка входа: ' + err.message);
  }
});

if (profileContinueBtn) {
  profileContinueBtn.addEventListener('click', () => {
    profileBlock.style.display = 'none';
    // Здесь можно добавить переход к основному функционалу приложения
  });
}

showSlide(currentSlide); 