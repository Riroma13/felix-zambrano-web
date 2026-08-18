(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'felix-zambrano-demo-bookings-v1';
  const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let bookings = loadLocalBookings();

  const header = $('#siteHeader');
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  const grid = $('#calendarGrid');
  const label = $('#calendarLabel');
  const dialog = $('#bookingDialog');
  const bookingContent = $('#bookingContent');

  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 10), { passive: true });
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  $$('#navMenu a').forEach(link => link.addEventListener('click', closeNavigation));

  function closeNavigation() {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  function loadLocalBookings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveLocalBookings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings)); }
    catch { /* La demo continúa sin persistencia. */ }
  }

  function keyFor(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    label.textContent = viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    grid.replaceChildren();

    weekdays.forEach(day => {
      const item = document.createElement('div');
      item.className = 'calendar-weekday';
      item.textContent = day;
      grid.append(item);
    });

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstWeekday; i += 1) {
      const empty = document.createElement('span');
      empty.className = 'calendar-day is-empty';
      grid.append(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = keyFor(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isPast = date < today;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.textContent = String(day);
      button.setAttribute('aria-label', date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

      if (isPast || isWeekend) {
        button.disabled = true;
      } else if (bookings[key]) {
        button.classList.add('is-requested');
        button.disabled = true;
        button.setAttribute('aria-label', `${button.getAttribute('aria-label')}, solicitud guardada en este dispositivo`);
      } else {
        button.addEventListener('click', () => openBookingDialog(date));
      }
      grid.append(button);
    }
  }

  function openBookingDialog(date) {
    const formatted = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    bookingContent.replaceChildren();
    const title = document.createElement('h2');
    title.id = 'bookingTitle';
    title.textContent = 'Solicitar esta fecha';
    const dateText = document.createElement('p');
    dateText.className = 'dialog-date';
    dateText.textContent = formatted;
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-field"><label for="bookingSchool">Nombre del colegio</label><input id="bookingSchool" name="school" autocomplete="organization" required></div>
      <div class="form-field"><label for="bookingContact">Persona de contacto</label><input id="bookingContact" name="contact" autocomplete="name" required></div>
      <div class="form-field"><label for="bookingEmail">Correo electrónico</label><input id="bookingEmail" name="email" type="email" autocomplete="email" required></div>
      <div class="form-field"><label for="bookingPhone">Teléfono</label><input id="bookingPhone" name="phone" type="tel" autocomplete="tel" required></div>
      <div class="form-field"><label for="bookingStudents">Número aproximado de alumnos</label><input id="bookingStudents" name="students" type="number" min="1" max="1000" required></div>
      <div class="form-field"><label for="bookingSlot">Horario preferido</label><select id="bookingSlot" name="slot"><option>Mañana</option><option>Tarde</option><option>A convenir</option></select></div>
      <button class="button button--primary" type="submit">Guardar solicitud de demostración</button>`;
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      bookings[keyFor(date)] = { ...data, createdAt: new Date().toISOString() };
      saveLocalBookings();
      showBookingConfirmation(formatted, data.school);
      renderCalendar();
    });
    bookingContent.append(title, dateText, form);
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }

  function showBookingConfirmation(formatted, school) {
    bookingContent.replaceChildren();
    const title = document.createElement('h2');
    title.id = 'bookingTitle';
    title.textContent = 'Solicitud guardada';
    const text = document.createElement('p');
    text.append('Se ha guardado en este dispositivo la solicitud de ');
    const strongSchool = document.createElement('strong');
    strongSchool.textContent = school;
    const strongDate = document.createElement('strong');
    strongDate.textContent = formatted;
    text.append(strongSchool, ' para el ', strongDate, '. En producción, este paso debe enviar los datos al servidor y un correo de confirmación.');
    const close = document.createElement('button');
    close.className = 'button button--secondary';
    close.type = 'button';
    close.textContent = 'Cerrar';
    close.addEventListener('click', closeDialog);
    bookingContent.append(title, text, close);
  }

  function closeDialog() {
    dialog.close();
    document.body.classList.remove('dialog-open');
  }

  $('#prevMonth').addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); renderCalendar(); });
  $('#nextMonth').addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); renderCalendar(); });
  $('#dialogClose').addEventListener('click', closeDialog);
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

  $('#contactForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const subject = encodeURIComponent(`Consulta de ${data.school || data.name}`);
    const body = encodeURIComponent(`Nombre: ${data.name}\nColegio o entidad: ${data.school || 'No indicado'}\nCorreo: ${data.email}\n\n${data.message}`);
    $('#contactStatus').textContent = 'Se abrirá tu aplicación de correo para completar el envío.';
    window.location.href = `mailto:hola@felixzambrano-libros.com?subject=${subject}&body=${body}`;
  });

  $('#currentYear').textContent = String(new Date().getFullYear());
  renderCalendar();
})();
