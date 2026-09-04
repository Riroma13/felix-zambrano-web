(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const confirmedEvents = [
    { date: "2026-10-13", city: "", type: "Visita confirmada" },
    { date: "2026-10-14", city: "", type: "Visita confirmada" },
    { date: "2026-10-15", city: "", type: "Visita confirmada" },
    { date: "2026-10-16", city: "", type: "Visita confirmada" },
    { date: "2026-12-04", city: "", type: "Visita confirmada" },
    { date: "2026-12-07", city: "", type: "Visita confirmada" },
    { date: "2026-12-08", city: "", type: "Visita confirmada" },
    { date: "2027-04-26", city: "", type: "Visita confirmada" },
    {
      date: "2027-10-01",
      city: "Almendralejo",
      type: "Encuentro literario",
      title: "Otoño Literario",
      description: "Félix Zambrano participará en las actividades del Otoño Literario organizadas por la Biblioteca Marcos Suárez de Almendralejo.",
      featured: true
    }
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedPreferredDate = '';
  let isSubmitting = false;

  const header = $('#siteHeader');
  const navToggle = $('#navToggle');
  const navToggleLabel = $('.nav__toggle .sr-only');
  const navMenu = $('#navMenu');
  const grid = $('#calendarGrid');
  const upcomingSection = $('#proximas-visitas');
  const upcomingVisits = $('#upcomingVisits');
  const label = $('#calendarLabel');
  const calendarStatus = $('#calendarStatus');
  const preferredDate = $('#preferredDate');
  const preferredDateHelp = $('#preferredDateHelp');
  const alternativeDate = $('#alternativeDate');
  const contactForm = $('#contactForm');
  const contactStatus = $('#contactStatus');
  const contactSubmit = $('#contactSubmit');
  const preferenceMessage = 'La fecha seleccionada es una preferencia. Félix confirmará posteriormente su disponibilidad.';
  const confirmedDateMessage = 'La fecha indicada ya tiene una visita confirmada. Elige otra fecha.';

  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 10), { passive: true });
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggleLabel.textContent = isOpen ? 'Cerrar menú' : 'Abrir menú';
  });
  $$('#navMenu a').forEach(link => link.addEventListener('click', closeNavigation));

  function closeNavigation() {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggleLabel.textContent = 'Abrir menú';
  }

  function keyFor(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function dateForKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parts = value.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0]
      && date.getMonth() === parts[1] - 1
      && date.getDate() === parts[2]
      ? date
      : null;
  }

  function confirmedEventFor(value) {
    if (!dateForKey(value)) return null;
    return confirmedEvents.find(event => event && event.date === value) || null;
  }

  function formatDate(date) {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function isValidConfirmedEvent(event) {
    return Boolean(
      event
      && typeof event.date === 'string'
      && dateForKey(event.date)
      && typeof event.city === 'string'
      && typeof event.type === 'string'
      && event.type.trim()
    );
  }

  function renderUpcomingVisits() {
    const futureEvents = confirmedEvents
      .filter(isValidConfirmedEvent)
      .map(event => ({ event, date: dateForKey(event.date) }))
      .filter(item => item.date && item.date > today)
      .sort((first, second) => first.date - second.date);

    upcomingSection.hidden = true;
    upcomingVisits.replaceChildren();
    if (!futureEvents.length) return;

    futureEvents.forEach(({ event, date }) => {
      const card = document.createElement('article');
      const isFeatured = event.featured === true;
      card.className = isFeatured ? 'upcoming-card upcoming-card--featured' : 'upcoming-card';

      const dateLabel = document.createElement('time');
      dateLabel.className = 'upcoming-card__date';
      dateLabel.dateTime = event.date;
      dateLabel.textContent = formatDate(date);
      card.append(dateLabel);

      if (isFeatured && typeof event.title === 'string' && event.title.trim()) {
        const title = document.createElement('h3');
        title.className = 'upcoming-card__title';
        title.textContent = event.title.trim();
        card.append(title);
      }

      if (event.city.trim()) {
        const locality = document.createElement('h3');
        locality.className = 'upcoming-card__city';
        locality.textContent = event.city.trim();
        card.append(locality);
      }

      const activity = document.createElement('p');
      activity.className = 'upcoming-card__type';
      activity.textContent = event.type.trim();
      card.append(activity);

      if (isFeatured && typeof event.description === 'string' && event.description.trim()) {
        const description = document.createElement('p');
        description.className = 'upcoming-card__description';
        description.textContent = event.description.trim();
        card.append(description);
      }

      if (isFeatured) {
        const logos = document.createElement('div');
        logos.className = 'event-logos';
        ['event-logo--primary', 'event-logo--secondary'].forEach(slotClass => {
          const logo = document.createElement('img');
          logo.className = `event-logo ${slotClass}`;
          logo.alt = '';
          logo.hidden = true;
          logos.append(logo);
        });
        card.append(logos);
      }

      upcomingVisits.append(card);
    });

    upcomingSection.hidden = false;
  }

  function updateCalendarStatus() {
    const date = dateForKey(selectedPreferredDate);
    calendarStatus.textContent = date
      ? `Fecha preferida seleccionada: ${formatDate(date)}. ${preferenceMessage}`
      : `Aún no has seleccionado una fecha. ${preferenceMessage}`;
    preferredDateHelp.textContent = date
      ? `Fecha elegida: ${formatDate(date)}. ${preferenceMessage}`
      : preferenceMessage;
  }

  function rejectConfirmedPreferredDate() {
    selectedPreferredDate = '';
    preferredDate.value = '';
    preferredDate.setCustomValidity(confirmedDateMessage);
    preferredDate.setAttribute('aria-invalid', 'true');
    updateCalendarStatus();
    preferredDateHelp.textContent = confirmedDateMessage;
    renderCalendar();
  }

  function scrollToFormOnMobile() {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    if (contactForm.getBoundingClientRect().top <= window.innerHeight) return;

    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    contactForm.scrollIntoView({ behavior, block: 'start' });
  }

  function setPreferredDate(value, shouldScroll = false) {
    if (confirmedEventFor(value)) {
      rejectConfirmedPreferredDate();
      return;
    }

    const date = dateForKey(value);
    selectedPreferredDate = date ? value : '';
    preferredDate.value = selectedPreferredDate;
    preferredDate.setCustomValidity('');
    preferredDate.removeAttribute('aria-invalid');
    if (date) viewDate = new Date(date.getFullYear(), date.getMonth(), 1);
    updateCalendarStatus();
    renderCalendar();
    if (shouldScroll) scrollToFormOnMobile();
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
      const isPast = date < today;
      const confirmedEvent = confirmedEventFor(key);
      const isSelected = key === selectedPreferredDate && !confirmedEvent;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.textContent = String(day);
      button.setAttribute('aria-label', formatDate(date));
      button.setAttribute('aria-pressed', String(isSelected));

      if (isSelected) button.classList.add('is-selected');
      if (confirmedEvent) {
        button.classList.add('is-confirmed');
        button.disabled = true;
        button.title = 'Visita confirmada';
        button.setAttribute('aria-label', `${formatDate(date)}. Visita confirmada`);
      } else if (isPast) {
        button.disabled = true;
      } else {
        button.addEventListener('click', () => setPreferredDate(key, true));
      }
      grid.append(button);
    }
  }

  function setContactStatus(message, state) {
    contactStatus.textContent = message;
    contactStatus.dataset.state = state;
  }

  preferredDate.min = keyFor(today);
  alternativeDate.min = keyFor(today);
  const syncPreferredDate = () => setPreferredDate(preferredDate.value);
  preferredDate.addEventListener('change', syncPreferredDate);

  $('#prevMonth').addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });
  $('#nextMonth').addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (isSubmitting) return;
    setContactStatus('', '');

    if (confirmedEventFor(preferredDate.value)) {
      rejectConfirmedPreferredDate();
      setContactStatus(confirmedDateMessage, 'error');
      preferredDate.focus();
      preferredDate.reportValidity();
      return;
    }

    if (!form.reportValidity()) return;

    isSubmitting = true;
    const originalSubmitLabel = contactSubmit.textContent;
    contactSubmit.disabled = true;
    contactSubmit.setAttribute('aria-busy', 'true');
    contactSubmit.textContent = 'Enviando solicitud…';
    setContactStatus('Enviando solicitud…', 'sending');

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree request failed with status ${response.status}`);

      form.reset();
      setPreferredDate('');
      setContactStatus('Solicitud enviada correctamente. Me pondré en contacto contigo para confirmar la disponibilidad de la fecha.', 'success');
    } catch {
      setContactStatus('No se ha podido enviar… Revisa tu conexión y vuelve a intentarlo.', 'error');
    } finally {
      isSubmitting = false;
      contactSubmit.disabled = false;
      contactSubmit.removeAttribute('aria-busy');
      contactSubmit.textContent = originalSubmitLabel;
    }
  });

  $('#currentYear').textContent = String(new Date().getFullYear());
  renderUpcomingVisits();
  updateCalendarStatus();
  renderCalendar();
})();
