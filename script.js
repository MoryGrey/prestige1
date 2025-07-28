// Глобальные переменные
let currentUser = null;
let userOrders = [];
let cancelOrderId = null; // ID заказа для отмены
let isAdmin = false; // Флаг админа
let adminTheme = 'pink'; // Тема админа: 'pink' или 'dark'

// Переменные для слайдов
let currentSlide = 0;
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

// Инициализация слайдов при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  showSlide(0);
});

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
  
  // Принудительно центрируем кнопку
  nextBtn.style.position = 'fixed';
  nextBtn.style.bottom = '20px';
  nextBtn.style.left = '50%';
  nextBtn.style.transform = 'translateX(-50%)';
  nextBtn.style.zIndex = '9999';
  nextBtn.style.margin = '0';
  nextBtn.style.width = 'auto';
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
  
  // Принудительно центрируем кнопку после любого клика
  setTimeout(() => {
    nextBtn.style.position = 'fixed';
    nextBtn.style.bottom = '20px';
    nextBtn.style.left = '50%';
    nextBtn.style.transform = 'translateX(-50%)';
    nextBtn.style.zIndex = '9999';
    nextBtn.style.margin = '0';
    nextBtn.style.width = 'auto';
  }, 10);
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
  if (hour >= 18 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

function showProfile(name, orders = 0) {
  const profileBlock = document.querySelector('.profile-block');
  const slides = document.querySelector('.slides');
  const indicators = document.querySelector('.slide-indicators');
  const logoBlock = document.querySelector('.logo-block');
  const authFormBlock = document.querySelector('.auth-form-block');
  const orderBlock = document.querySelector('.order-block');
  const historyBlock = document.querySelector('.history-block');
  const adminBlock = document.querySelector('.admin-block');

  if (profileBlock) profileBlock.style.display = 'flex';
  if (slides) slides.style.display = 'none';
  if (indicators) indicators.style.display = 'none';
  if (logoBlock) logoBlock.style.display = 'none';
  if (authFormBlock) authFormBlock.style.display = 'none';
  if (orderBlock) orderBlock.style.display = 'none';
  if (historyBlock) historyBlock.style.display = 'none';
  if (adminBlock) adminBlock.style.display = 'none';

  const greeting = document.getElementById('profile-greeting');
  const ordersElement = document.getElementById('profile-orders');
  
  if (greeting) {
    const timeGreeting = getGreetingByTime();
    greeting.textContent = `${timeGreeting}, ${name}!`;
  }
  
  if (ordersElement) {
    ordersElement.textContent = orders;
  }

  // Обновляем активную кнопку в нижнем баре
  updateBottomBarActive('profile');
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
    
    // Очищаем форму
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    document.getElementById('reg-password').value = '';
  } catch (err) {
    let errorMessage = 'Ошибка регистрации';
    
    if (err.code === 'auth/email-already-in-use') {
      // Если email уже используется, пробуем войти
      try {
        const email = phone.replace(/\D/g, '') + '@prestige.taxi';
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const doc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userName = doc.exists ? doc.data().name : name;
        showProfile(userName);
        
        // Очищаем форму
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-phone').value = '';
        document.getElementById('reg-password').value = '';
        return; // Выходим без показа ошибки
      } catch (loginErr) {
        errorMessage = 'Неверный пароль для существующего аккаунта';
      }
    } else if (err.code === 'auth/weak-password') {
      errorMessage = 'Пароль должен содержать минимум 6 символов';
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Неверный формат номера телефона';
    } else {
      errorMessage = 'Ошибка регистрации: ' + err.message;
    }
    
    showNotification(errorMessage, 'error');
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
    
    // Очищаем форму
    document.getElementById('login-phone').value = '';
    document.getElementById('login-password').value = '';
  } catch (err) {
    let errorMessage = 'Ошибка входа';
    
    if (err.code === 'auth/user-not-found') {
      errorMessage = 'Аккаунт не найден. Зарегистрируйтесь';
    } else if (err.code === 'auth/wrong-password') {
      errorMessage = 'Неверный пароль';
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Неверный формат номера телефона';
    } else {
      errorMessage = 'Ошибка входа: ' + err.message;
    }
    
    showNotification(errorMessage, 'error');
  }
});

if (profileContinueBtn) {
  profileContinueBtn.addEventListener('click', () => {
    profileBlock.style.display = 'none';
    // Здесь можно добавить переход к основному функционалу приложения
  });
}

// Обработчик авторизации
firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    try {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const name = userData.name || 'Клиент';
        const orders = userData.orders || 0;
        
        // Сохраняем данные пользователя
        currentUser = {
          uid: user.uid,
          name: name,
          phone: userData.phone || user.email
        };
        
        // Проверяем, является ли пользователь админом
        if (checkAdminAccess()) {
          showAdminPage();
        } else {
          showProfile(name, orders);
          loadUserOrders(); // Загружаем заказы при авторизации
        }
      } else {
        showProfile('Клиент', 0);
      }
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      showProfile('Клиент', 0);
    }
  } else {
    // Пользователь не авторизован
    const profileBlock = document.querySelector('.profile-block');
    const orderBlock = document.querySelector('.order-block');
    const historyBlock = document.querySelector('.history-block');
    const adminBlock = document.querySelector('.admin-block');
    const slides = document.querySelector('.slides');
    const indicators = document.querySelector('.slide-indicators');
    const logoBlock = document.querySelector('.logo-block');
    const authFormBlock = document.querySelector('.auth-form-block');

    if (profileBlock) profileBlock.style.display = 'none';
    if (orderBlock) orderBlock.style.display = 'none';
    if (historyBlock) historyBlock.style.display = 'none';
    if (adminBlock) adminBlock.style.display = 'none';
    if (slides) slides.style.display = 'block';
    if (indicators) indicators.style.display = 'flex';
    if (logoBlock) logoBlock.style.display = 'block';
    if (authFormBlock) authFormBlock.style.display = 'none';
    
    currentUser = null; // Сбрасываем текущего пользователя при выходе
    userOrders = []; // Сбрасываем заказы при выходе
    isAdmin = false; // Сбрасываем флаг админа
  }
});

showSlide(currentSlide);

// Функции для страницы заказа такси
function showOrderPage() {
  const profileBlock = document.querySelector('.profile-block');
  const orderBlock = document.querySelector('.order-block');
  const historyBlock = document.querySelector('.history-block');
  const slides = document.querySelector('.slides');
  const indicators = document.querySelector('.slide-indicators');
  const logoBlock = document.querySelector('.logo-block');
  const authFormBlock = document.querySelector('.auth-form-block');

  if (profileBlock) profileBlock.style.display = 'none';
  if (orderBlock) orderBlock.style.display = 'flex';
  if (historyBlock) historyBlock.style.display = 'none';
  if (slides) slides.style.display = 'none';
  if (indicators) indicators.style.display = 'none';
  if (logoBlock) logoBlock.style.display = 'none';
  if (authFormBlock) authFormBlock.style.display = 'none';

  // Обновляем активную кнопку в нижнем баре
  updateBottomBarActive('order');
}

function showProfilePage() {
  const profileBlock = document.querySelector('.profile-block');
  const orderBlock = document.querySelector('.order-block');
  const historyBlock = document.querySelector('.history-block');
  const slides = document.querySelector('.slides');
  const indicators = document.querySelector('.slide-indicators');
  const logoBlock = document.querySelector('.logo-block');
  const authFormBlock = document.querySelector('.auth-form-block');

  if (profileBlock) profileBlock.style.display = 'flex';
  if (orderBlock) orderBlock.style.display = 'none';
  if (historyBlock) historyBlock.style.display = 'none';
  if (slides) slides.style.display = 'none';
  if (indicators) indicators.style.display = 'none';
  if (logoBlock) logoBlock.style.display = 'none';
  if (authFormBlock) authFormBlock.style.display = 'none';

  // Обновляем активную кнопку в нижнем баре
  updateBottomBarActive('profile');
}

function updateBottomBarActive(page) {
  const profileBtn = document.querySelectorAll('.bar-btn-clean')[0];
  const orderBtn = document.querySelectorAll('.bar-btn-clean')[1];
  const historyBtn = document.querySelectorAll('.bar-btn-clean')[2];

  // Убираем активный класс со всех кнопок
  profileBtn.classList.remove('active');
  orderBtn.classList.remove('active');
  historyBtn.classList.remove('active');

  // Добавляем активный класс к нужной кнопке
  if (page === 'profile') {
    profileBtn.classList.add('active');
  } else if (page === 'order') {
    orderBtn.classList.add('active');
  } else if (page === 'history') {
    historyBtn.classList.add('active');
  }
}

function toggleOrderOptions() {
  const optionsBtn = document.querySelector('.order-options-btn');
  const optionsPanel = document.getElementById('order-options-panel');
  const preOrderCheckbox = document.getElementById('pre-order');
  const childSeatCheckbox = document.getElementById('child-seat');
  const timePicker = document.getElementById('order-time-picker');

  if (optionsPanel.classList.contains('show')) {
    optionsPanel.classList.remove('show');
    optionsBtn.classList.remove('active');
  } else {
    optionsPanel.classList.add('show');
    optionsBtn.classList.add('active');
  }

  // Обработчик для детского кресла - обновляем цену сразу
  if (childSeatCheckbox) {
    childSeatCheckbox.addEventListener('change', function() {
      updateOrderPrice();
    });
  }

  // Показываем/скрываем выбор времени при переключении предварительного заказа
  if (preOrderCheckbox) {
    preOrderCheckbox.addEventListener('change', function() {
      if (this.checked) {
        timePicker.style.display = 'block';
        timePicker.style.animation = 'slideDown 0.3s ease';
      } else {
        timePicker.style.display = 'none';
      }
    });
  }

  // Обновляем цену при изменении опций
  updateOrderPrice();
}

function updateOrderPrice() {
  const basePrice = 150;
  const childSeatPrice = 50;
  const viaPointPrice = 100;
  const childSeatCheckbox = document.getElementById('child-seat');
  const priceValue = document.querySelector('.order-price-value');

  let totalPrice = basePrice;

  if (childSeatCheckbox && childSeatCheckbox.checked) {
    totalPrice += childSeatPrice;
  }

  // Подсчитываем количество дополнительных точек
  const viaPoints = document.querySelectorAll('.order-via-point-wrapper');
  totalPrice += viaPoints.length * viaPointPrice;

  if (priceValue) {
    priceValue.textContent = `${totalPrice} ₽`;
  }
  
  return totalPrice;
}

function processOrder() {
  const fromAddress = document.getElementById('from-address').value.trim();
  const toAddress = document.getElementById('to-address').value.trim();
  const childSeat = document.getElementById('child-seat').checked;
  const preOrder = document.getElementById('pre-order').checked;
  const orderTime = document.getElementById('order-time').value;
  const totalPrice = updateOrderPrice();

  // Очищаем предыдущие ошибки
  clearValidationErrors();

  // Проверяем обязательные поля
  let hasErrors = false;
  
  if (!fromAddress) {
    showValidationError('from-address', 'Заполните пожалуйста адрес отправления');
    hasErrors = true;
  }
  
  if (!toAddress) {
    showValidationError('to-address', 'Заполните пожалуйста адрес назначения');
    hasErrors = true;
  }

  // Собираем все дополнительные точки
  const viaPoints = [];
  const viaPointInputs = document.querySelectorAll('.order-via-point-wrapper input');
  viaPointInputs.forEach(input => {
    const value = input.value.trim();
    if (value) {
      viaPoints.push(value);
    }
  });

  // Проверяем, что все дополнительные точки заполнены
  if (viaPointInputs.length > 0) {
    viaPointInputs.forEach((input, index) => {
      if (!input.value.trim()) {
        showValidationError(input.id, 'Заполните пожалуйста дополнительную точку маршрута');
        hasErrors = true;
      }
    });
  }

  if (hasErrors) {
    return;
  }

  // Проверяем время для предварительного заказа
  if (preOrder && !orderTime) {
    showNotification('Пожалуйста, выберите время для предварительного заказа', 'error', 3000);
    return;
  }

  // Сохраняем заказ в БД
  const orderData = {
    from: fromAddress,
    to: toAddress,
    viaPoints: viaPoints,
    childSeat: childSeat,
    preOrder: preOrder,
    orderTime: orderTime,
    price: totalPrice
  };

  saveOrderToDatabase(orderData).then(orderId => {
    if (orderId) {
      // Показываем красивое уведомление об успешном заказе
      showNotification(
        `Заказ успешно создан! Стоимость: ${totalPrice}₽. Можете наблюдать за статусом в истории.`, 
        'success', 
        3000
      );

      // Очищаем форму
      document.getElementById('from-address').value = '';
      document.getElementById('to-address').value = '';
      document.getElementById('child-seat').checked = false;
      document.getElementById('pre-order').checked = false;
      document.getElementById('order-time').value = '';
      document.getElementById('order-time-picker').style.display = 'none';
      
      // Удаляем все дополнительные точки
      const viaPointWrappers = document.querySelectorAll('.order-via-point-wrapper');
      viaPointWrappers.forEach(wrapper => wrapper.remove());

      // Скрываем панель опций
      const optionsPanel = document.getElementById('order-options-panel');
      const optionsBtn = document.querySelector('.order-options-btn');
      if (optionsPanel) optionsPanel.classList.remove('show');
      if (optionsBtn) optionsBtn.classList.remove('active');

      // Обновляем цену
      updateOrderPrice();

      // Обновляем историю заказов
      loadUserOrders();

      // Обновляем счётчик в профиле
      updateProfileOrdersCount();
    } else {
      showNotification('Ошибка при создании заказа. Попробуйте ещё раз.', 'error', 3000);
    }
  });
}

// Инициализация обработчиков событий для страницы заказа
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM загружен, инициализация обработчиков...');
  
  // Делегирование событий для кнопок нижнего бара
  document.addEventListener('click', function(e) {
    const target = e.target.closest('.bar-btn-clean');
    if (!target) return;
    
    console.log('Клик по кнопке бара:', target.textContent.trim());
    
    // Определяем какая кнопка была нажата
    const buttonText = target.textContent.trim().toLowerCase();
    
    if (buttonText.includes('история')) {
      console.log('Переход на историю через делегирование');
      e.preventDefault();
      showHistoryPage();
    } else if (buttonText.includes('профиль')) {
      console.log('Переход на профиль через делегирование');
      e.preventDefault();
      showProfilePage();
    } else if (buttonText.includes('заказать')) {
      console.log('Переход на заказ через делегирование');
      e.preventDefault();
      showOrderPage();
    }
  });
  
  // Обработчики для кнопок нижнего бара
  const historyButtons = document.querySelectorAll('.bar-btn-clean[onclick*="showHistoryPage"]');
  historyButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      console.log('Клик по кнопке истории (addEventListener)');
      e.preventDefault();
      showHistoryPage();
    });
  });
  
  const profileButtons = document.querySelectorAll('.bar-btn-clean[onclick*="showProfilePage"]');
  profileButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      console.log('Клик по кнопке профиля (addEventListener)');
      e.preventDefault();
      showProfilePage();
    });
  });
  
  const orderButtons = document.querySelectorAll('.bar-btn-clean[onclick*="showOrderPage"]');
  orderButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      console.log('Клик по кнопке заказа (addEventListener)');
      e.preventDefault();
      showOrderPage();
    });
  });

  // Обработчики для переключателей опций
  const childSeatCheckbox = document.getElementById('child-seat');
  if (childSeatCheckbox) {
    childSeatCheckbox.addEventListener('change', updateOrderPrice); // Update price immediately
  }

  const preOrderCheckbox = document.getElementById('pre-order');
  if (preOrderCheckbox) {
    preOrderCheckbox.addEventListener('change', function() {
      const timePicker = document.getElementById('order-time-picker');
      if (this.checked) {
        timePicker.style.display = 'block';
        timePicker.style.animation = 'slideDown 0.3s ease';
      } else {
        timePicker.style.display = 'none';
      }
      updateOrderPrice(); // Also update price when pre-order changes
    });
  }

  // Инициализация поля времени
  const timeInput = document.getElementById('order-time');
  if (timeInput) {
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60000); // Минимум через 30 минут
    const maxTime = new Date(now.getTime() + 24 * 60 * 60000); // Максимум через 24 часа
    
    timeInput.min = minTime.toISOString().slice(0, 16);
    timeInput.max = maxTime.toISOString().slice(0, 16);
    
    // Устанавливаем значение по умолчанию (через час)
    const defaultTime = new Date(now.getTime() + 60 * 60000);
    timeInput.value = defaultTime.toISOString().slice(0, 16);
  }
}); 

// Функции для красивых уведомлений
function showNotification(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notifications-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.2)"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.2)"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  } else {
    iconSvg = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.1)"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-text">${message}</div>
      <button class="notification-close" onclick="closeNotification(this)">×</button>
    </div>
  `;

  container.appendChild(notification);

  // Автоматическое закрытие через 3 секунды
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notification.querySelector('.notification-close'));
    }, duration);
  }

  return notification;
}

function closeNotification(closeButton) {
  const notification = closeButton.closest('.notification');
  if (notification) {
    notification.classList.add('hiding');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

// Функция для показа ошибки валидации
function showValidationError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    // Убираем предыдущие ошибки
    const existingError = field.parentNode.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Создаем элемент ошибки
    const errorElement = document.createElement('div');
    errorElement.className = 'validation-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: #F44336;
      font-size: 0.85rem;
      margin-top: 4px;
      padding: 4px 8px;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 6px;
      border-left: 3px solid #F44336;
      font-weight: 500;
    `;
    
    field.parentNode.appendChild(errorElement);
    
    // Подсвечиваем поле
    field.style.borderColor = '#F44336';
    field.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
    
    // Убираем подсветку через 3 секунды
    setTimeout(() => {
      field.style.borderColor = '';
      field.style.boxShadow = '';
    }, 3000);
  }
}

// Функция для очистки ошибок валидации
function clearValidationErrors() {
  const errors = document.querySelectorAll('.validation-error');
  errors.forEach(error => error.remove());
  
  const fields = document.querySelectorAll('.order-input');
  fields.forEach(field => {
    field.style.borderColor = '';
    field.style.boxShadow = '';
  });
} 

// Функции для работы с заказами и историей

// Функция для показа страницы профиля
function showProfilePage() {
  const profileBlock = document.querySelector('.profile-block');
  const orderBlock = document.querySelector('.order-block');
  const historyBlock = document.querySelector('.history-block');
  const slides = document.querySelector('.slides');
  const indicators = document.querySelector('.slide-indicators');
  const logoBlock = document.querySelector('.logo-block');
  const authFormBlock = document.querySelector('.auth-form-block');

  if (profileBlock) profileBlock.style.display = 'flex';
  if (orderBlock) orderBlock.style.display = 'none';
  if (historyBlock) historyBlock.style.display = 'none';
  if (slides) slides.style.display = 'none';
  if (indicators) indicators.style.display = 'none';
  if (logoBlock) logoBlock.style.display = 'none';
  if (authFormBlock) authFormBlock.style.display = 'none';

  // Обновляем активную кнопку в нижнем баре
  updateBottomBarActive('profile');
}

// Функция для показа страницы истории
function showHistoryPage() {
  console.log('showHistoryPage вызвана'); // Отладочный лог
  
  try {
    const profileBlock = document.querySelector('.profile-block');
    const orderBlock = document.querySelector('.order-block');
    const historyBlock = document.querySelector('.history-block');
    const slides = document.querySelector('.slides');
    const indicators = document.querySelector('.slide-indicators');
    const logoBlock = document.querySelector('.logo-block');
    const authFormBlock = document.querySelector('.auth-form-block');

    console.log('Найденные блоки:', {
      profileBlock: !!profileBlock,
      orderBlock: !!orderBlock,
      historyBlock: !!historyBlock,
      slides: !!slides,
      indicators: !!indicators,
      logoBlock: !!logoBlock,
      authFormBlock: !!authFormBlock
    });

    // Скрываем все блоки
    if (profileBlock) profileBlock.style.display = 'none';
    if (orderBlock) orderBlock.style.display = 'none';
    if (slides) slides.style.display = 'none';
    if (indicators) indicators.style.display = 'none';
    if (logoBlock) logoBlock.style.display = 'none';
    if (authFormBlock) authFormBlock.style.display = 'none';

    // Показываем блок истории
    if (historyBlock) {
      historyBlock.style.display = 'flex';
      console.log('Блок истории показан');
    } else {
      console.error('Блок истории не найден!');
      return;
    }

    // Обновляем активную кнопку в нижнем баре
    updateBottomBarActive('history');
    
    // Загружаем историю заказов
    if (currentUser) {
      loadUserOrders();
    } else {
      console.log('Пользователь не авторизован, история не загружена');
    }
    
  } catch (error) {
    console.error('Ошибка в showHistoryPage:', error);
  }
}

// Функция для обновления активной кнопки в нижнем баре
function updateBottomBarActive(page) {
  console.log('updateBottomBarActive вызвана с page:', page); // Отладочный лог
  
  try {
    const buttons = document.querySelectorAll('.bar-btn-clean');
    console.log('Найдено кнопок в баре:', buttons.length);
    
    if (buttons.length < 3) {
      console.error('Недостаточно кнопок в нижнем баре!');
      return;
    }
    
    const profileBtn = buttons[0];
    const orderBtn = buttons[1];
    const historyBtn = buttons[2];

    // Убираем активный класс со всех кнопок
    profileBtn.classList.remove('active');
    orderBtn.classList.remove('active');
    historyBtn.classList.remove('active');

    // Добавляем активный класс к нужной кнопке
    if (page === 'profile') {
      profileBtn.classList.add('active');
      console.log('Активна кнопка профиля');
    } else if (page === 'order') {
      orderBtn.classList.add('active');
      console.log('Активна кнопка заказа');
    } else if (page === 'history') {
      historyBtn.classList.add('active');
      console.log('Активна кнопка истории');
    } else {
      console.warn('Неизвестная страница:', page);
    }
  } catch (error) {
    console.error('Ошибка в updateBottomBarActive:', error);
  }
}

// Функция для сохранения заказа в БД
async function saveOrderToDatabase(orderData) {
  if (!currentUser) {
    showNotification('Ошибка: пользователь не авторизован', 'error', 3000);
    return null;
  }
  
  try {
    const orderRef = await firebase.firestore().collection('orders').add({
      userId: currentUser.uid,
      userPhone: currentUser.phone,
      userName: currentUser.name,
      fromAddress: orderData.from,
      toAddress: orderData.to,
      price: orderData.price,
      childSeat: orderData.childSeat,
      preOrder: orderData.preOrder,
      orderTime: orderData.orderTime,
      status: 'waiting', // Ожидание водителя
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Заказ успешно сохранен с ID:', orderRef.id);
    return orderRef.id;
  } catch (error) {
    console.error('Ошибка сохранения заказа:', error);
    showNotification('Ошибка сохранения заказа в базу данных', 'error', 3000);
    return null;
  }
}

// Функция для загрузки заказов пользователя
async function loadUserOrders() {
  if (!currentUser) return;
  
  try {
    // Простой запрос без составного индекса
    const ordersSnapshot = await firebase.firestore()
      .collection('orders')
      .where('userId', '==', currentUser.uid)
      .get();
    
    userOrders = [];
    ordersSnapshot.forEach(doc => {
      userOrders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Сортируем по времени создания (новые сначала)
    userOrders.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
    
    displayUserOrders();
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    // Показываем уведомление об ошибке
    showNotification('Ошибка загрузки истории заказов', 'error', 3000);
  }
}

// Функция для отображения заказов пользователя
function displayUserOrders() {
  const historyEmpty = document.getElementById('history-empty');
  const historyItems = document.getElementById('history-items');
  
  if (userOrders.length === 0) {
    historyEmpty.style.display = 'flex';
    historyItems.innerHTML = '';
    return;
  }
  
  historyEmpty.style.display = 'none';
  
  const ordersHTML = userOrders.map(order => createOrderCard(order)).join('');
  historyItems.innerHTML = ordersHTML;
  
  // Добавляем обработчики для кнопок отмены
  userOrders.forEach(order => {
    const cancelBtn = document.getElementById(`cancel-order-${order.id}`);
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => cancelOrder(order.id));
    }
  });
}

// Функция для создания карточки заказа
function createOrderCard(order) {
  const statusText = getStatusText(order.status, order.carInfo);
  const statusClass = getStatusClass(order.status);
  const orderTime = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString('ru-RU') : 'Неизвестно';
  const canCancel = order.status === 'waiting';
  
  return `
    <div class="history-item" data-order-id="${order.id}">
      <div class="history-item-header">
        <div class="history-item-info">
          <div class="history-item-route">
            <span class="from">${order.fromAddress}</span>
            <span class="arrow">→</span>
            <span class="to">${order.toAddress}</span>
          </div>
          <div class="history-item-price">${order.price} ₽</div>
        </div>
      </div>
      
      <div class="history-item-status">
        <div class="history-status-badge ${statusClass}">${statusText}</div>
        ${order.carInfo ? `<div class="history-car-info">${order.carInfo}</div>` : ''}
      </div>
      
      <div class="history-item-details">
        <div class="history-item-time">${orderTime}</div>
        <div class="history-item-actions">
          ${canCancel ? `
            <button class="history-cancel-btn" id="cancel-order-${order.id}">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Отменить
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Функция для получения текста статуса
function getStatusText(status, carInfo = null) {
  switch (status) {
    case 'waiting': return 'Ожидание водителя';
    case 'assigned': return 'Водитель назначен';
    case 'driving': return carInfo ? `Поехала ${carInfo}` : 'Поехала';
    case 'arrived': return carInfo ? `Приехала ${carInfo}` : 'Приехала';
    case 'completed': return 'Завершён';
    case 'cancelled': return 'Отменён';
    default: return 'Неизвестно';
  }
}

// Функция для получения класса статуса
function getStatusClass(status) {
  switch (status) {
    case 'waiting': return 'waiting';
    case 'assigned': return 'assigned';
    case 'driving': return 'driving';
    case 'arrived': return 'arrived';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    default: return 'waiting';
  }
}

// Функция для отмены заказа
async function cancelOrder(orderId) {
  if (!confirm('Вы уверены, что хотите отменить заказ?')) return;
  
  try {
    // Проверяем, что заказ существует и принадлежит пользователю
    const orderDoc = await firebase.firestore().collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      showNotification('Заказ не найден', 'error', 3000);
      return;
    }
    
    const orderData = orderDoc.data();
    if (orderData.userId !== currentUser.uid) {
      showNotification('Нет прав для отмены этого заказа', 'error', 3000);
      return;
    }
    
    if (orderData.status !== 'waiting') {
      showNotification('Можно отменить только ожидающие заказы', 'error', 3000);
      return;
    }
    
    cancelOrderId = orderId; // Сохраняем ID заказа для отмены
    showConfirmationModal(); // Показываем модальное окно подтверждения
  } catch (error) {
    console.error('Ошибка отмены заказа:', error);
    showNotification('Ошибка при отмене заказа. Попробуйте ещё раз.', 'error', 3000);
  }
}

// Функция для обновления счётчика заказов в профиле
async function updateProfileOrdersCount() {
  if (!currentUser) return;
  
  try {
    const activeOrders = userOrders.filter(order => 
      order.status === 'waiting' || order.status === 'driving'
    ).length;
    
    // Обновляем в БД
    await firebase.firestore().collection('users').doc(currentUser.uid).update({
      orders: activeOrders
    });
    
    // Обновляем отображение в профиле
    const ordersElement = document.getElementById('profile-orders');
    if (ordersElement) {
      ordersElement.textContent = activeOrders;
    }
  } catch (error) {
    console.error('Ошибка обновления счётчика заказов:', error);
  }
}

// Функция для показа уведомления о прибытии водителя
function showDriverArrival(carInfo) {
  const notification = document.getElementById('driver-arrival-notification');
  const carInfoElement = document.getElementById('driver-car-info');
  
  if (carInfoElement) {
    carInfoElement.textContent = carInfo;
  }
  
  notification.style.display = 'block';
}

// Функция для закрытия уведомления о прибытии водителя
function closeDriverArrival() {
  const notification = document.getElementById('driver-arrival-notification');
  notification.classList.add('hiding');
  
  setTimeout(() => {
    notification.style.display = 'none';
    notification.classList.remove('hiding');
  }, 400);
}

// Функция для обновления статуса заказа (для бота водителей)
async function updateOrderStatus(orderId, status, carInfo = null) {
  try {
    const updateData = {
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (carInfo) {
      updateData.carInfo = carInfo;
    }
    
    await firebase.firestore().collection('orders').doc(orderId).update(updateData);
    
    // Обновляем локальный массив
    const orderIndex = userOrders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      userOrders[orderIndex].status = status;
      if (carInfo) {
        userOrders[orderIndex].carInfo = carInfo;
      }
    }
    
    // Обновляем отображение
    displayUserOrders();
    
    // Обновляем счётчик в профиле
    updateProfileOrdersCount();
    
    // Показываем уведомление о прибытии водителя
    if (status === 'driving' && carInfo) {
      showDriverArrival(carInfo);
    }
    
  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
  }
} 

// Функция для показа модального окна подтверждения отмены
function showConfirmationModal() {
  if (!cancelOrderId) return;
  
  // Находим заказ для отображения информации
  const order = userOrders.find(o => o.id === cancelOrderId);
  if (!order) return;
  
  // Заполняем информацию о заказе
  const routeElement = document.getElementById('cancel-order-route');
  const priceElement = document.getElementById('cancel-order-price');
  
  if (routeElement) {
    routeElement.innerHTML = `
      <span class="from">${order.fromAddress}</span>
      <span class="arrow">→</span>
      <span class="to">${order.toAddress}</span>
    `;
  }
  
  if (priceElement) {
    priceElement.textContent = `${order.price} ₽`;
  }
  
  // Показываем модальное окно
  const modal = document.getElementById('cancel-order-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Функция для закрытия модального окна
function closeCancelModal() {
  const modal = document.getElementById('cancel-order-modal');
  if (modal) {
    modal.classList.add('hiding');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('hiding');
      cancelOrderId = null; // Сбрасываем ID заказа
    }, 300);
  }
}

// Функция для подтверждения отмены заказа
async function confirmCancelOrder() {
  if (!cancelOrderId) return;
  
  try {
    // Проверяем, что заказ существует и принадлежит пользователю
    const orderDoc = await firebase.firestore().collection('orders').doc(cancelOrderId).get();
    if (!orderDoc.exists) {
      showNotification('Заказ не найден', 'error', 3000);
      closeCancelModal();
      return;
    }
    
    const orderData = orderDoc.data();
    if (orderData.userId !== currentUser.uid) {
      showNotification('Нет прав для отмены этого заказа', 'error', 3000);
      closeCancelModal();
      return;
    }
    
    if (orderData.status !== 'waiting') {
      showNotification('Можно отменить только ожидающие заказы', 'error', 3000);
      closeCancelModal();
      return;
    }
    
    await firebase.firestore().collection('orders').doc(cancelOrderId).update({
      status: 'cancelled',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Обновляем локальный массив
    const orderIndex = userOrders.findIndex(order => order.id === cancelOrderId);
    if (orderIndex !== -1) {
      userOrders[orderIndex].status = 'cancelled';
    }
    
    // Закрываем модальное окно
    closeCancelModal();
    
    // Обновляем отображение
    displayUserOrders();
    
    // Обновляем счётчик в профиле
    updateProfileOrdersCount();
    
    showNotification('Заказ успешно отменён', 'success', 3000);
  } catch (error) {
    console.error('Ошибка отмены заказа:', error);
    showNotification('Ошибка при отмене заказа. Попробуйте ещё раз.', 'error', 3000);
    closeCancelModal();
  }
} 

// Админ функции
function checkAdminAccess() {
  // Проверяем, является ли пользователь админом
  // Для демонстрации используем логин "admin" и пароль "admin"
  // Также проверяем флаг isAdmin (устанавливается через промокод)
  if (isAdmin || (currentUser && (currentUser.name === 'admin' || currentUser.phone === '+79000000000'))) {
    isAdmin = true;
    return true;
  }
  return false;
}

function showAdminPage() {
  if (!checkAdminAccess()) {
    // Показываем форму входа в админку
    showAdminLoginModal();
    return;
  }

  const adminBlock = document.querySelector('.admin-block');
  const profileBlock = document.querySelector('.profile-block');
  const orderBlock = document.querySelector('.order-block');
  const historyBlock = document.querySelector('.history-block');
  const slides = document.querySelector('.slides');
  const indicators = document.querySelector('.slide-indicators');
  const logoBlock = document.querySelector('.logo-block');
  const authFormBlock = document.querySelector('.auth-form-block');

  if (adminBlock) adminBlock.style.display = 'flex';
  if (profileBlock) profileBlock.style.display = 'none';
  if (orderBlock) orderBlock.style.display = 'none';
  if (historyBlock) historyBlock.style.display = 'none';
  if (slides) slides.style.display = 'none';
  if (indicators) indicators.style.display = 'none';
  if (logoBlock) logoBlock.style.display = 'none';
  if (authFormBlock) authFormBlock.style.display = 'none';

  // Обновляем приветствие админа
  const adminGreeting = document.getElementById('admin-greeting');
  if (adminGreeting) {
    const timeGreeting = getGreetingByTime();
    adminGreeting.textContent = `${timeGreeting}, Николь!`;
  }

  // Загружаем статистику
  loadAdminStats();
}

// Функция переключения темы удалена, так как кнопка убрана из интерфейса

async function loadAdminStats() {
  try {
    const ordersRef = firebase.firestore().collection('orders');
    
    // Подсчитываем выполненные заказы
    const completedSnapshot = await ordersRef.where('status', '==', 'completed').get();
    const completedCount = completedSnapshot.size;
    
    // Подсчитываем отмененные заказы
    const cancelledSnapshot = await ordersRef.where('status', '==', 'cancelled').get();
    const cancelledCount = cancelledSnapshot.size;
    
    // Обновляем счетчики
    const completedElement = document.getElementById('admin-completed-orders');
    const cancelledElement = document.getElementById('admin-cancelled-orders');
    
    if (completedElement) completedElement.textContent = completedCount;
    if (cancelledElement) cancelledElement.textContent = cancelledCount;
    
    // Получаем количество водителей в очереди (это будет обновляться через WebSocket или API)
    const queueElement = document.getElementById('admin-queue-count');
    if (queueElement) queueElement.textContent = '0'; // Пока статично
    
  } catch (error) {
    console.error('Ошибка при загрузке статистики:', error);
  }
}

function showAdminStatistics() {
  const modal = document.getElementById('admin-stats-modal');
  const content = document.getElementById('admin-stats-content');
  
  if (modal && content) {
    loadDetailedStats(content);
    modal.style.display = 'flex';
  }
}

async function loadDetailedStats(contentElement) {
  try {
    const ordersRef = firebase.firestore().collection('orders');
    
    // Получаем последние выполненные заказы
    const recentCompleted = await ordersRef
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();
    
    let statsHTML = '<div class="admin-stats-details">';
    statsHTML += '<h3>📋 Последние выполненные заказы:</h3>';
    
    if (recentCompleted.empty) {
      statsHTML += '<p>Нет выполненных заказов</p>';
    } else {
      recentCompleted.forEach(doc => {
        const order = doc.data();
        const driverName = order.driverName || 'Неизвестно';
        const carInfo = order.carInfo || 'Неизвестно';
        const completedAt = order.completedAt ? 
          new Date(order.completedAt.toDate()).toLocaleString('ru-RU') : 'Неизвестно';
        
        statsHTML += `
          <div class="admin-stat-item">
            <div class="admin-stat-item-info">
              <strong>${driverName}</strong> (${carInfo})
            </div>
            <div class="admin-stat-item-time">${completedAt}</div>
          </div>
        `;
      });
    }
    
    statsHTML += '</div>';
    contentElement.innerHTML = statsHTML;
    
  } catch (error) {
    contentElement.innerHTML = '<p>Ошибка при загрузке статистики</p>';
    console.error('Ошибка при загрузке детальной статистики:', error);
  }
}

function showFreeOrderForm() {
  const modal = document.getElementById('admin-free-order-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

async function createFreeOrder() {
  const from = document.getElementById('free-order-from').value.trim();
  const to = document.getElementById('free-order-to').value.trim();
  const phone = document.getElementById('free-order-phone').value.trim();
  const comment = document.getElementById('free-order-comment').value.trim();
  
  if (!from || !to || !phone) {
    showNotification('Заполните все обязательные поля', 'error');
    return;
  }
  
  // Создаем объект заказа
  const order = {
    from: from,
    to: to,
    phone: phone,
    comment: comment,
    status: 'waiting',
    payment_status: 'paid', // Помечаем как оплаченный
    created_at: new Date().toISOString(),
    order_type: 'free', // Тип заказа - бесплатный
    admin_created: true // Создан администратором
  };
  
  try {
    // Сохраняем в Firebase
    const docRef = await firebase.firestore().collection('orders').add(order);
    
    showNotification(`Бесплатный заказ создан! ID: ${docRef.id}`, 'success');
    closeAdminModal();
    
    // Очищаем форму
    document.getElementById('free-order-from').value = '';
    document.getElementById('free-order-to').value = '';
    document.getElementById('free-order-phone').value = '';
    document.getElementById('free-order-comment').value = '';
    
    // Обновляем статистику
    loadAdminStats();
    
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    showNotification('Ошибка при создании заказа', 'error');
  }
}

function showQueueManagement() {
  const modal = document.getElementById('admin-queue-modal');
  const content = document.getElementById('admin-queue-content');
  
  if (modal && content) {
    loadQueueData(content);
    modal.style.display = 'flex';
  }
}

async function loadQueueData(contentElement) {
  try {
    // Здесь должна быть логика получения данных очереди из бота
    // Пока используем заглушку
    let queueHTML = '<div class="admin-queue-details">';
    queueHTML += '<h3>👥 Водители в очереди:</h3>';
    queueHTML += '<p>Данные очереди загружаются...</p>';
    queueHTML += '<p>Для получения актуальных данных используйте бота</p>';
    queueHTML += '</div>';
    
    contentElement.innerHTML = queueHTML;
    
  } catch (error) {
    contentElement.innerHTML = '<p>Ошибка при загрузке данных очереди</p>';
    console.error('Ошибка при загрузке данных очереди:', error);
  }
}

function closeAdminModal() {
  const modals = document.querySelectorAll('.admin-modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

// Обновляем функцию updateBottomBarActive для поддержки админки
function updateBottomBarActive(page) {
  const buttons = document.querySelectorAll('.bar-btn-clean');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeButton = document.querySelector(`.bar-btn-clean[onclick*="${page}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

// Функции для промокода
function showPromoModal() {
  const modal = document.getElementById('promo-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Фокусируемся на поле ввода
    const input = document.getElementById('promo-code');
    if (input) {
      input.focus();
    }
  }
}

function closePromoModal() {
  const modal = document.getElementById('promo-modal');
  if (modal) {
    modal.style.display = 'none';
    // Очищаем поле ввода
    const input = document.getElementById('promo-code');
    if (input) {
      input.value = '';
    }
  }
}

function processPromoCode() {
  const promoCode = document.getElementById('promo-code').value.trim().toUpperCase();
  
  if (!promoCode) {
    showNotification('Введите промокод', 'error');
    return;
  }
  
  // Проверяем промокод NIKOL
  if (promoCode === 'NIKOL') {
    // Устанавливаем флаг админа
    isAdmin = true;
    
    // Обновляем данные пользователя для админки
    if (currentUser) {
      currentUser.name = 'admin';
    } else {
      currentUser = {
        uid: 'admin',
        name: 'admin',
        phone: '+79000000000'
      };
    }
    
    // Закрываем модальное окно
    closePromoModal();
    
    // Показываем админ панель
    showAdminPage();
    
    // Показываем уведомление об успехе
    showNotification('Добро пожаловать в админ панель!', 'success');
    
  } else {
    showNotification('Неверный промокод', 'error');
  }
}

// Добавляем обработчик Enter для поля промокода
document.addEventListener('DOMContentLoaded', function() {
  const promoInput = document.getElementById('promo-code');
  if (promoInput) {
    promoInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        processPromoCode();
      }
    });
  }
  
  // Добавляем обработчик Enter для полей входа в админку
  const adminLoginUsername = document.getElementById('admin-login-username');
  const adminLoginPassword = document.getElementById('admin-login-password');
  
  if (adminLoginUsername) {
    adminLoginUsername.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('admin-login-password').focus();
      }
    });
  }
  
  if (adminLoginPassword) {
    adminLoginPassword.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        processAdminLogin();
      }
    });
  }
});

// Функции для входа в админку через логин и пароль
function showAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Фокусируемся на поле логина
    const input = document.getElementById('admin-login-username');
    if (input) {
      input.focus();
    }
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) {
    modal.style.display = 'none';
    // Очищаем поля ввода
    const usernameInput = document.getElementById('admin-login-username');
    const passwordInput = document.getElementById('admin-login-password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
  }
}

function processAdminLogin() {
  const username = document.getElementById('admin-login-username').value.trim();
  const password = document.getElementById('admin-login-password').value.trim();
  
  if (!username || !password) {
    showNotification('Введите логин и пароль', 'error');
    return;
  }
  
  // Проверяем логин и пароль NIKOL
  if (username.toUpperCase() === 'NIKOL' && password.toUpperCase() === 'NIKOL') {
    // Устанавливаем флаг админа
    isAdmin = true;
    
    // Обновляем данные пользователя для админки
    if (currentUser) {
      currentUser.name = 'admin';
    } else {
      currentUser = {
        uid: 'admin',
        name: 'admin',
        phone: '+79000000000'
      };
    }
    
    // Закрываем модальное окно
    closeAdminLoginModal();
    
    // Показываем админ панель
    showAdminPage();
    
    // Показываем уведомление об успехе
    showNotification('Добро пожаловать в админ панель!', 'success');
    
  } else {
    showNotification('Неверный логин или пароль', 'error');
  }
} 

// Функция переключения панели опций заказа
function toggleOrderOptions() {
  const panel = document.getElementById('order-options-panel');
  const btn = document.querySelector('.order-options-btn');
  
  if (panel.classList.contains('show')) {
    panel.classList.remove('show');
    btn.classList.remove('active');
  } else {
    panel.classList.add('show');
    btn.classList.add('active');
  }
}

// Функция переключения выбора времени
function toggleTimePicker() {
  const timePicker = document.getElementById('order-time-picker');
  const preOrderCheckbox = document.getElementById('pre-order');
  
  if (preOrderCheckbox.checked) {
    timePicker.style.display = 'block';
  } else {
    timePicker.style.display = 'none';
  }
}

// Функция добавления дополнительной точки маршрута
function addViaPoint() {
  const inputGroup = document.getElementById('order-input-group');
  const viaPointCount = document.querySelectorAll('.order-via-point-wrapper').length;
  const pointId = `via-point-${viaPointCount + 1}`;
  
  const viaPointWrapper = document.createElement('div');
  viaPointWrapper.className = 'order-via-point-wrapper';
  viaPointWrapper.innerHTML = `
    <div class="order-input-wrapper">
      <div class="order-input-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#FFD600"/>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#181818"/>
        </svg>
      </div>
      <input type="text" id="${pointId}" class="order-input" placeholder="Дополнительная точка (+100₽)" maxlength="50">
    </div>
    <button class="order-remove-point-btn" onclick="removeViaPoint(this)">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
  
  // Вставляем перед кнопкой добавления
  const addBtn = document.querySelector('.order-add-point-btn');
  inputGroup.insertBefore(viaPointWrapper, addBtn);
  
  // Обновляем цену
  updateOrderPrice();
}

// Функция удаления дополнительной точки маршрута
function removeViaPoint(button) {
  const wrapper = button.closest('.order-via-point-wrapper');
  if (wrapper) {
    wrapper.remove();
    // Обновляем цену
    updateOrderPrice();
  }
}

// Функция создания карточки заказа для истории
function createHistoryOrderCard(order) {
  const statusClass = getStatusClass(order.status);
  const statusText = getStatusText(order.status, order.carInfo);
  const orderTime = order.created_at ? 
    new Date(order.created_at.toDate ? order.created_at.toDate() : order.created_at).toLocaleString('ru-RU') : 
    'Неизвестно';
  
  const fromAddress = order.from || order.fromAddress || 'Неизвестно';
  const toAddress = order.to || order.toAddress || 'Неизвестно';
  const price = order.price || '150';
  
  return `
    <div class="history-item">
      <div class="history-item-header">
        <div class="history-item-info">
          <div class="history-item-route">
            <span class="from">${fromAddress}</span>
            <span class="arrow">→</span>
            <span class="to">${toAddress}</span>
          </div>
          <div class="history-item-status">
            <span class="history-status-badge ${statusClass}">${statusText}</span>
          </div>
        </div>
        <div class="history-item-price">${price} ₽</div>
      </div>
      <div class="history-item-details">
        <div class="history-item-time">${orderTime}</div>
      </div>
    </div>
  `;
} 

// Функция выхода из админки
function exitAdminPanel() {
  // Сбрасываем флаг админа
  isAdmin = false;
  
  // Скрываем админ блок
  const adminBlock = document.querySelector('.admin-block');
  if (adminBlock) {
    adminBlock.style.display = 'none';
  }
  
  // Показываем обычный профиль пользователя
  const profileBlock = document.querySelector('.profile-block');
  if (profileBlock) {
    profileBlock.style.display = 'flex';
  }
  
  // Обновляем активную кнопку в нижнем баре
  updateBottomBarActive('profile');
  
  // Показываем уведомление
  showNotification('Вы вышли из админ панели', 'info');
} 