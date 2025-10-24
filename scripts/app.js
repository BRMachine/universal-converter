console.log('app.js загружен');

// Проверка доступности conversionData
if (typeof conversionData === 'undefined') {
    console.error('ОШИБКА: conversionData не найден! Проверьте converters.js');
}


// Инициализация Telegram Web App
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

const app = {
    currentCategory: 'currency',
    history: [],
    
    init() {
        this.setupTheme();
        this.setupEventListeners();
        this.updateUnits();
        this.loadCurrencyRates();
        this.loadHistory();
    },
    
    setupTheme() {
        // Применяем тему Telegram
        if (tg && tg.themeParams) {
            const theme = tg.themeParams;
            if (theme.bg_color) {
                document.body.style.background = theme.bg_color;
            }
        }
    },
    
    setupEventListeners() {
        document.getElementById('category').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.updateUnits();
        });
        
        document.getElementById('input-value').addEventListener('input', () => {
            this.performConversion();
        });
        
        document.getElementById('from-unit').addEventListener('change', () => {
            this.performConversion();
        });
        
        document.getElementById('to-unit').addEventListener('change', () => {
            this.performConversion();
        });
        
        document.getElementById('swap').addEventListener('click', () => {
            this.swapUnits();
        });
        
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
    },
    
    updateUnits() {
        const data = conversionData[this.currentCategory];
        const fromSelect = document.getElementById('from-unit');
        const toSelect = document.getElementById('to-unit');
        
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        Object.entries(data.units).forEach(([key, value]) => {
            const option1 = new Option(value, key);
            const option2 = new Option(value, key);
            fromSelect.add(option1);
            toSelect.add(option2);
        });
        
        // Устанавливаем разные значения по умолчанию
        if (toSelect.options.length > 1) {
            toSelect.selectedIndex = 1;
        }
        
        this.performConversion();
    },
    
    performConversion() {
        const value = parseFloat(document.getElementById('input-value').value);
        
        if (isNaN(value)) {
            document.getElementById('output-value').textContent = '—';
            return;
        }
        
        const from = document.getElementById('from-unit').value;
        const to = document.getElementById('to-unit').value;
        
        const result = convert(value, from, to, this.currentCategory);
        
        if (result !== null && !isNaN(result)) {
            // Форматируем результат
            let formattedResult;
            if (Math.abs(result) >= 1000000) {
                formattedResult = result.toExponential(4);
            } else if (Math.abs(result) < 0.0001 && result !== 0) {
                formattedResult = result.toExponential(4);
            } else {
                formattedResult = result.toFixed(6).replace(/\.?0+$/, '');
            }
            
            document.getElementById('output-value').textContent = formattedResult;
            this.addToHistory(value, from, to, result);
        } else {
            document.getElementById('output-value').textContent = 'Ошибка';
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
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            conversionData.currency.rates = data.rates;
            
            // Если текущая категория - валюта, обновляем конвертацию
            if (this.currentCategory === 'currency') {
                this.performConversion();
            }
        } catch (error) {
            console.error('Ошибка загрузки курсов валют:', error);
        }
    },
    
    addToHistory(value, from, to, result) {
        const fromUnit = conversionData[this.currentCategory].units[from];
        const toUnit = conversionData[this.currentCategory].units[to];
        
        let formattedResult = result.toFixed(4).replace(/\.?0+$/, '');
        let formattedValue = value.toString();
        
        const entry = {
            text: `${formattedValue} ${fromUnit} = ${formattedResult} ${toUnit}`,
            timestamp: Date.now()
        };
        
        // Добавляем в начало и ограничиваем до 10 записей
        this.history.unshift(entry);
        this.history = this.history.slice(0, 10);
        
        this.saveHistory();
        this.renderHistory();
    },
    
    saveHistory() {
        try {
            localStorage.setItem('converter-history', JSON.stringify(this.history));
        } catch (e) {
            console.error('Ошибка сохранения истории:', e);
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
            console.error('Ошибка загрузки истории:', e);
        }
    },
    
    renderHistory() {
        const list = document.getElementById('history-list');
        
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

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
