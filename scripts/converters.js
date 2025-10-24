console.log('converters.js загружен');


// База данных всех единиц измерения и конвертации
const conversionData = {
    currency: {
        name: 'Валюта',
        units: {
            'USD': '🇺🇸 Доллар США',
            'EUR': '🇪🇺 Евро',
            'RUB': '🇷🇺 Российский рубль',
            'GBP': '🇬🇧 Фунт стерлингов',
            'JPY': '🇯🇵 Японская иена',
            'CNY': '🇨🇳 Китайский юань',
            'TRY': '🇹🇷 Турецкая лира',
            'KZT': '🇰🇿 Казахстанский тенге',
            'UAH': '🇺🇦 Украинская гривна'
        },
        rates: null // Будет загружено через API
    },
    
    length: {
        name: 'Длина',
        units: {
            'm': 'Метры',
            'km': 'Километры',
            'cm': 'Сантиметры',
            'mm': 'Миллиметры',
            'mi': 'Мили',
            'yd': 'Ярды',
            'ft': 'Футы',
            'in': 'Дюймы'
        },
        baseUnit: 'm',
        conversions: {
            'm': 1,
            'km': 0.001,
            'cm': 100,
            'mm': 1000,
            'mi': 0.000621371,
            'yd': 1.09361,
            'ft': 3.28084,
            'in': 39.3701
        }
    },
    
    weight: {
        name: 'Вес',
        units: {
            'kg': 'Килограммы',
            'g': 'Граммы',
            'mg': 'Миллиграммы',
            'lb': 'Фунты',
            'oz': 'Унции',
            't': 'Тонны'
        },
        baseUnit: 'kg',
        conversions: {
            'kg': 1,
            'g': 1000,
            'mg': 1000000,
            'lb': 2.20462,
            'oz': 35.274,
            't': 0.001
        }
    },
    
    temperature: {
        name: 'Температура',
        units: {
            'C': 'Цельсий (°C)',
            'F': 'Фаренгейт (°F)',
            'K': 'Кельвин (K)'
        },
        convert: (value, from, to) => {
            let celsius;
            
            if (from === 'C') celsius = value;
            else if (from === 'F') celsius = (value - 32) * 5/9;
            else if (from === 'K') celsius = value - 273.15;
            
            if (to === 'C') return celsius;
            else if (to === 'F') return (celsius * 9/5) + 32;
            else if (to === 'K') return celsius + 273.15;
        }
    },
    
    volume: {
        name: 'Объём',
        units: {
            'l': 'Литры',
            'ml': 'Миллилитры',
            'm3': 'Кубометры',
            'gal': 'Галлоны (US)',
            'qt': 'Кварты',
            'pt': 'Пинты',
            'cup': 'Чашки',
            'fl_oz': 'Жидкие унции'
        },
        baseUnit: 'l',
        conversions: {
            'l': 1,
            'ml': 1000,
            'm3': 0.001,
            'gal': 0.264172,
            'qt': 1.05669,
            'pt': 2.11338,
            'cup': 4.22675,
            'fl_oz': 33.814
        }
    },
    
    area: {
        name: 'Площадь',
        units: {
            'm2': 'Квадратные метры',
            'km2': 'Квадратные километры',
            'cm2': 'Квадратные сантиметры',
            'ha': 'Гектары',
            'ac': 'Акры',
            'ft2': 'Квадратные футы',
            'mi2': 'Квадратные мили'
        },
        baseUnit: 'm2',
        conversions: {
            'm2': 1,
            'km2': 0.000001,
            'cm2': 10000,
            'ha': 0.0001,
            'ac': 0.000247105,
            'ft2': 10.7639,
            'mi2': 3.861e-7
        }
    },
    
    speed: {
        name: 'Скорость',
        units: {
            'kmh': 'Километры/час',
            'mph': 'Мили/час',
            'ms': 'Метры/секунду',
            'kn': 'Узлы'
        },
        baseUnit: 'ms',
        conversions: {
            'ms': 1,
            'kmh': 3.6,
            'mph': 2.23694,
            'kn': 1.94384
        }
    },
    
    time: {
        name: 'Время',
        units: {
            's': 'Секунды',
            'min': 'Минуты',
            'h': 'Часы',
            'd': 'Дни',
            'w': 'Недели',
            'mon': 'Месяцы',
            'y': 'Годы'
        },
        baseUnit: 's',
        conversions: {
            's': 1,
            'min': 1/60,
            'h': 1/3600,
            'd': 1/86400,
            'w': 1/604800,
            'mon': 1/2628000,
            'y': 1/31536000
        }
    },
    
    data: {
        name: 'Данные',
        units: {
            'B': 'Байты',
            'KB': 'Килобайты',
            'MB': 'Мегабайты',
            'GB': 'Гигабайты',
            'TB': 'Терабайты'
        },
        baseUnit: 'B',
        conversions: {
            'B': 1,
            'KB': 1/1024,
            'MB': 1/(1024*1024),
            'GB': 1/(1024*1024*1024),
            'TB': 1/(1024*1024*1024*1024)
        }
    }
};

// Функция конвертации
function convert(value, from, to, category) {
    const data = conversionData[category];
    
    if (!data) return null;
    
    // Специальная обработка для температуры
    if (category === 'temperature') {
        return data.convert(value, from, to);
    }
    
    // Специальная обработка для валют
    if (category === 'currency') {
        if (!data.rates) return null;
        const baseRate = data.rates[from] || 1;
        const targetRate = data.rates[to] || 1;
        return (value / baseRate) * targetRate;
    }
    
    // Для остальных категорий: конвертация через базовую единицу
    const baseValue = value / data.conversions[from];
    return baseValue * data.conversions[to];
}
