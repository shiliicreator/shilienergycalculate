// ---------- Константы ----------
const AVERAGE_PRICE = 4.0; // Пример: средняя цена за кВт*ч (можно изменить)
                           // Можно подставить любое справочное значение

// ---------- Глобальные переменные ----------
let deviceCounter = 0; // Счётчик добавленных приборов
let devicesData = [];  // Массив для хранения данных о приборах

// DOM-элементы
const devicesWrapper = document.getElementById("devices-wrapper");
const addDeviceBtn = document.getElementById("add-device-btn");
const calculateBtn = document.getElementById("calculate-btn");
const resetBtn = document.getElementById("reset-btn");
const resultTableContainer = document.getElementById("result-table-container");

// ---------- Функции ----------

/**
 * Создаёт DOM-элементы для формы одного прибора и добавляет их в контейнер.
 */
function addDeviceForm() {
  deviceCounter++;
  
  // Объект с данными о приборе (по умолчанию)
  const deviceObj = {
    id: deviceCounter,
    name: "",            // Название прибора
    power: 0,            // Мощность (Вт)
    timeValue: 1,        // Введённое время (числовое значение)
    timeUnit: "hours",   // Единица измерения времени (hours, days, months, years)
    useAveragePrice: false,
    customPrice: 4.0     // Пользовательская цена
  };

  // Сохраним этот объект в массив
  devicesData.push(deviceObj);

  // Создаём форму
  const formDiv = document.createElement("div");
  formDiv.classList.add("device-form");
  formDiv.setAttribute("data-device-id", deviceObj.id);

  // Поле для названия прибора
  const nameField = document.createElement("div");
  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Название прибора:";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Напр. Чайник";
  nameInput.addEventListener("input", (e) => {
    deviceObj.name = e.target.value;
  });
  nameField.appendChild(nameLabel);
  nameField.appendChild(nameInput);

  // Поле для мощности
  const powerField = document.createElement("div");
  const powerLabel = document.createElement("label");
  powerLabel.textContent = "Мощность (Вт):";
  const powerInput = document.createElement("input");
  powerInput.type = "number";
  powerInput.placeholder = "Вт";
  powerInput.min = "0";
  powerInput.value = "0";
  powerInput.addEventListener("input", (e) => {
    deviceObj.power = parseFloat(e.target.value) || 0;
  });
  powerField.appendChild(powerLabel);
  powerField.appendChild(powerInput);

  // Поле для введённого времени и единиц
  const timeField = document.createElement("div");
  const timeLabel = document.createElement("label");
  timeLabel.textContent = "Введённое время:";
  const timeInput = document.createElement("input");
  timeInput.type = "number";
  timeInput.min = "0";
  timeInput.value = "1";
  timeInput.addEventListener("input", (e) => {
    deviceObj.timeValue = parseFloat(e.target.value) || 0;
  });
  const timeSelect = document.createElement("select");
  ["hours","days","months","years"].forEach(unit => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit === "hours" 
                         ? "часы" 
                         : unit === "days" 
                           ? "дни" 
                           : unit === "months"
                             ? "месяцы"
                             : "годы";
    timeSelect.appendChild(option);
  });
  timeSelect.addEventListener("change", (e) => {
    deviceObj.timeUnit = e.target.value;
  });

  timeField.appendChild(timeLabel);
  timeField.appendChild(timeInput);
  timeField.appendChild(timeSelect);

  // Чекбокс "Использовать среднюю цену" и поле "Своя цена"
  const priceField = document.createElement("div");
  const priceLabel = document.createElement("label");
  priceLabel.textContent = "Цена за кВт*ч:";
  const priceCheckboxLabel = document.createElement("label");
  priceCheckboxLabel.style.fontWeight = "normal";
  const priceCheckbox = document.createElement("input");
  priceCheckbox.type = "checkbox";
  priceCheckbox.addEventListener("change", (e) => {
    deviceObj.useAveragePrice = e.target.checked;
    // Если чекбокс отмечен, блокируем поле customPriceInput
    customPriceInput.disabled = deviceObj.useAveragePrice;
  });
  priceCheckboxLabel.appendChild(priceCheckbox);
  priceCheckboxLabel.appendChild(document.createTextNode("Использовать среднюю"));
  
  const customPriceInput = document.createElement("input");
  customPriceInput.type = "number";
  customPriceInput.min = "0";
  customPriceInput.step = "0.01";
  customPriceInput.value = AVERAGE_PRICE; 
  customPriceInput.addEventListener("input", (e) => {
    deviceObj.customPrice = parseFloat(e.target.value) || 0;
  });

  priceField.appendChild(priceLabel);
  priceField.appendChild(customPriceInput);
  priceField.appendChild(priceCheckboxLabel);

  // Добавляем всё в форму
  formDiv.appendChild(nameField);
  formDiv.appendChild(powerField);
  formDiv.appendChild(timeField);
  formDiv.appendChild(priceField);

  // Добавляем форму в контейнер
  devicesWrapper.appendChild(formDiv);
}

/**
 * Удаляет все данные о приборах и очищает интерфейс.
 */
function resetAll() {
  deviceCounter = 0;
  devicesData = [];
  devicesWrapper.innerHTML = "";
  resultTableContainer.innerHTML = "";
}

/**
 * Основная функция расчёта и построения таблицы сравнения.
 */
function calculate() {
  // Если нет ни одного прибора, ничего не делаем
  if (devicesData.length === 0) {
    alert("Сначала добавьте хотя бы один прибор.");
    return;
  }

  // Сначала обновляем данные из форм (на случай, если пользователь менял что-то)
  // – уже учтено в слушателях input, поэтому дополнительно ничего делать не нужно

  // Подготовим результаты для каждой строки (периода)
  // Формат: 
  // [
  //   { period: "1 час", values: [ { consumption: number, cost: number } for each device ] },
  //   { period: "1 день", values: [...] },
  //   ...
  // ]
  const periods = [
    { key: "hour",   label: "1 час",    hours: 1 },
    { key: "day",    label: "1 день",   hours: 24 },
    { key: "month",  label: "1 месяц",  hours: 24 * 30.44 },
    { key: "year",   label: "1 год",    hours: 24 * 365.25 },
    { key: "custom", label: "",         hours: 0 } // Для пользовательского времени
  ];

  // Заполним таблицу периодов
  // Для custom мы заполним label позже (зависит от unit)
  let tableData = periods.map(p => ({
    periodLabel: p.label,
    periodKey: p.key,
    values: [] // Массив результатов по каждому прибору
  }));

  // Рассчитываем данные для каждого прибора по каждому периоду
  devicesData.forEach(device => {
    const priceToUse = device.useAveragePrice ? AVERAGE_PRICE : device.customPrice;

    tableData.forEach(item => {
      let hoursToUse;

      // Если не custom, берём из массива
      if (item.periodKey !== "custom") {
        hoursToUse = item.hours;
      } else {
        // Для custom: считаем количество часов в зависимости от timeUnit
        // Для лейбла строки тоже зададим период
        const labelUnit = device.timeUnit === "hours" 
                          ? "часа(ов)"
                          : device.timeUnit === "days"
                            ? "дня(ей)"
                            : device.timeUnit === "months"
                              ? "месяца(ев)"
                              : "годы";
        
        // Формируем надпись, например: "3 дня","6 дней", 2 "часа" "5 часов" и т.д.
        item.periodLabel = `${device.timeValue} ${labelUnit}`;

        switch (device.timeUnit) {
          case "hours":
            hoursToUse = device.timeValue;
            break;
          case "days":
            hoursToUse = device.timeValue * 24;
            break;
          case "months":
            // Условно берём 30.44 дней в месяце
            hoursToUse = device.timeValue * 24 * 30.44;
            break;
          case "years":
            // Условно берём 365.25 дней в году
            hoursToUse = device.timeValue * 24 * 365.25;
            break;
        }
      }

      const consumptionKWh = (device.power / 1000) * hoursToUse;
      const cost = consumptionKWh * priceToUse;

      item.values.push({
        consumption: consumptionKWh,
        cost: cost,
        deviceName: device.name || `Прибор #${device.id}`
      });
    });
  });

  // Теперь строим общую таблицу сравнения:
  // Первая колонка: Период (выравнен по левому краю)
  // Далее по каждому прибору 2 колонки: Потребление, Цена

  // Узнаем, сколько у нас приборов
  const deviceCount = devicesData.length;

  // Очищаем контейнер, если там что-то было
  resultTableContainer.innerHTML = "";

  // Создаем таблицу
  const table = document.createElement("table");

  // Создаём шапку
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // Первая ячейка шапки – "Период"
  const periodTh = document.createElement("th");
  periodTh.textContent = "Период";
  headerRow.appendChild(periodTh);

  // Далее блоки по 2 колонки на каждый прибор
  devicesData.forEach((device, index) => {
    // Первая колонка – Потребление (кВт*ч) (указываем, к какому прибору относится)
    const consumptionTh = document.createElement("th");
    consumptionTh.textContent = `Потребление (кВт*ч)\n${device.name || "Прибор #" + device.id}`;
    headerRow.appendChild(consumptionTh);

    // Вторая колонка – Цена (РУБ)
    const costTh = document.createElement("th");
    costTh.textContent = `Цена (РУБ)\n${device.name || "Прибор #" + device.id}`;
    headerRow.appendChild(costTh);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Тело таблицы
  const tbody = document.createElement("tbody");
  tableData.forEach(rowData => {
    // Создаем строку
    const row = document.createElement("tr");

    // Ячейка периода (всегда одна)
    const periodTd = document.createElement("td");
    periodTd.textContent = rowData.periodLabel;
    periodTd.classList.add("period-cell");
    row.appendChild(periodTd);

    // Далее данные по каждому прибору (2 ячейки на прибор)
    rowData.values.forEach(val => {
      const consumptionTd = document.createElement("td");
      consumptionTd.textContent = val.consumption.toFixed(3);
      row.appendChild(consumptionTd);

      const costTd = document.createElement("td");
      costTd.textContent = val.cost.toFixed(2);
      row.appendChild(costTd);
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Вставляем таблицу в контейнер
  resultTableContainer.appendChild(table);
}

// ---------- События ----------

// Кнопка "Добавить прибор"
addDeviceBtn.addEventListener("click", () => {
  addDeviceForm();
});

// Кнопка "Рассчитать"
calculateBtn.addEventListener("click", () => {
  calculate();
});

// Кнопка "Сбросить"
resetBtn.addEventListener("click", () => {
  const confirmed = confirm("Вы действительно хотите сбросить все данные?");
  if (confirmed) {
    resetAll();
  }
});

// При начальной загрузке – добавим одну форму по умолчанию
document.addEventListener("DOMContentLoaded", () => {
  addDeviceForm();
});

