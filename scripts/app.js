console.log('app.js загружен');

// Инициализация Telegram Web App
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    console.log('Telegram WebApp инициализирован');
}

const app = {
    currentCategory: 'currency',
    history: [],
    currencyLoaded: false,
    
    init() {
        console.log('app.init() запущен');
        this.setupTheme();
        this.setupEventListeners();
        this.updateUnits();
        this.loadCurrencyRates();
        this.loadHistory();
        console.log('app инициализирован полностью');
    },
    
    setupTheme() {
        if (tg && tg.themeParams) {
            const theme = tg.themeParams;
            if (theme.bg_color) {
                document.body.style.background = theme.bg_color;
            }
        }
    },
    
    setupEventListeners() {
        const categorySelect = document.getElementById('category');
        const inputValue = document.getElementById('input-value');
        const fromUnit = document.getElementById('from-unit');
        const toUnit = document.getElementById('to-unit');
        const swapBtn = document.getElementById('swap');
        const clearHistoryBtn = document.getElementById('clear-history');
        
        if (!categorySelect || !inputValue || !fromUnit || !toUnit) {
            console.error('Ошибка: не найдены DOM элементы');
            return;
        }
        
        categorySelect.addEventListener('change', (e) => {
            console.log('Категория изменена на:', e.target.value);
            this.currentCategory = e.target.value;
            this.updateUnits();
        });
        
        inputValue.addEventListener('input', () => {
            this.performConversion();
        });
        
        fromUnit.addEventListener('change', () => {
            this.performConversion();
        });
        
        toUnit.addEventListener('change', () => {
            this.performConversion();
        });
        
        swapBtn.addEventListener('click', () => {
            this.swapUnits();
        });
        
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }
        
        console.log('Event listeners настроены');
    },
    
    updateUnits() {
        console.log('updateUnits для категории:', this.currentCategory);
        
        if (typeof conversionData === 'undefined') {
            console.error('conversionData не определена!');
            return;
        }
        
        const data = conversionData[this.currentCategory];
        if (!data) {
            console.error('Нет данных для категории:', this.currentCategory);
            return;
        }
        
        const fromSelect = document.getElementById('from-unit');
        const toSelect = document.getElementById('to-unit');
        
        if (!fromSelect || !toSelect) {
            console.error('Select элементы не найдены');
            return;
        }
        
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        Object.entries(data.units).forEach(([key, value]) => {
            const option1 = new Option(value, key);
            const option2 = new Option(value, key);
            fromSelect.add(option1);
            toSelect.add(option2);
        });
        
        if (toSelect.options.length > 1) {
            toSelect.selectedIndex = 1;
        }
        
        this.performConversion();
    },
    
    performConversion() {
        const inputElement = document.getElementById('input-value');
        const outputElement = document.getElementById('output-value');
        
        if (!inputElement || !outputElement) {
            console.error('Input/Output элементы не найдены');
            return;
        }
        
        const value = parseFloat(inputElement.value);
        
        if (isNaN(value)) {
            outputElement.textContent = '—';
            return;
        }
        
        const from = document.getElementById('from-unit').value;
        const to = document.getElementById('to-unit').value;
        
        try {
            const result = convert(value, from, to, this.currentCategory);
            
            if (result !== null && !isNaN(result)) {
                let formattedResult;
                if (Math.abs(result) >= 1000000) {
                    formattedResult = result.toExponential(4);
                } else if (Math.abs(result) < 0.0001 && result !== 0) {
                    formattedResult = result.toExponential(4);
                } else {
                    formattedResult = result.toFixed(6).replace(/\.?0+$/, '');
                }
                
                outputElement.textContent = formattedResult;
                this.addToHistory(value, from, to, result);
            } else {
                outputElement.textContent = 'Ошибка';
                console.error('Ошибка конвертации:', { value, from, to, result });
            }
        } catch (error) {
            console.error('Исключение при конвертации:', error);
            outputElement.textContent = 'Ошибка';
        }
    },
    
    swapUnits() {
        const fromSelect = document.getElementById('from-unit');
        const toSelect = document.getElementById('to-unit');
        const temp = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = temp;
        this.performConversion();
    },
    
    async loadCurrencyRates() {
        try {
            console.log('Загрузка курсов валют...');
            
            // Используем несколько API для надёжности
            const urls = [
                'https://api.exchangerate-api.com/v4/latest/USD',
                'https://v6.exchangerate-api.com/v6/latest/USD',
                'https://open.er-api.com/v6/latest/USD'
            ];
            
            let success = false;
            for (const url of urls) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Ищем объект rates в разных форматах ответа
                        const rates = data.rates || data.data || data;
                        
                        if (rates && typeof rates === 'object') {
                            conversionData.currency.rates = rates;
                            this.currencyLoaded = true;
                            console.log('Курсы валют загружены успешно');
                            success = true;
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`Ошибка с API ${url}:`, err.message);
                    continue;
                }
            }
            
            if (!success) {
                console.warn('Не удалось загрузить курсы валют, используются значения по умолчанию');
                // Устанавливаем default rates если все API недоступны
                conversionData.currency.rates = {
                    'USD': 1,
                    'EUR': 0.92,
                    'RUB': 102,
                    'GBP': 0.79,
                    'JPY': 149.5,
                    'CNY': 7.24,
                    'TRY': 34.5,
                    'KZT': 460,
                    'UAH': 40.5
                };
                this.currencyLoaded = true;
            }
            
            if (this.currentCategory === 'currency') {
                this.performConversion();
            }
        } catch (error) {
            console.error('Ошибка при загрузке валют:', error);
        }
    },
    
    addToHistory(value, from, to, result) {
        const data = conversionData[this.currentCategory];
        if (!data) return;
        
        const fromUnit = data.units[from];
        const toUnit = data.units[to];
        
        let formattedResult = result.toFixed(4).replace(/\.?0+$/, '');
        let formattedValue = value.toString();
        
        const entry = {
            text: `${formattedValue} ${fromUnit} = ${formattedResult} ${toUnit}`,
            timestamp: Date.now()
        };
        
        this.history.unshift(entry);
        this.history = this.history.slice(0, 10);
        
        this.saveHistory();
        this.renderHistory();
    },
    
    saveHistory() {
        try {
            localStorage.setItem('converter-history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('Ошибка сохранения истории:', e);
        }
    },
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('converter-history');
            if (saved) {
                this.history = JSON.parse(saved);
                this.renderHistory();
            }
        } catch (e) {
            console.warn('Ошибка загрузки истории:', e);
        }
    },
    
    renderHistory() {
        const list = document.getElementById('history-list');
        if (!list) return;
        
        if (this.history.length === 0) {
            list.innerHTML = '<li class="empty-history">История пуста</li>';
            return;
        }
        
        list.innerHTML = this.history
            .map(item => `<li>${item.text}</li>`)
            .join('');
    },
    
    clearHistory() {
        if (confirm('Очистить всю историю конвертаций?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }
};

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded, запускаем app.init()');
        app.init();
    });
} else {
    console.log('DOM уже готов, запускаем app.init() сразу');
    app.init();
}

// Добавляем обработку ошибок
window.addEventListener('error', (event) => {
    console.error('Глобальная ошибка:', event.error);
});
