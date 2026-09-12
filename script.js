/* =========================================================
   QAYYUM OFFICIALZ — XAUUSD INTELLIGENCE
   JAVASCRIPT — PART 1
   CORE ENGINE + LIVE GOLD PRICE + MARKET STATE

   THEME:
   BLACK / RED / GOLD

   MARKET:
   XAUUSDT

   PIP MODEL:
   $0.10 = 1 PIP
   $1.00  = 10 PIPS

   NOTE:
   This is a market-analysis dashboard.
   It does not place real orders automatically.
========================================================= */


/* =========================================================
   1. GLOBAL CONFIGURATION
========================================================= */

const APP_CONFIG = {

    symbol: "XAUUSDT",

    displaySymbol: "XAUUSD",

    defaultTimeframe: "15m",

    candleLimit: 500,

    restAPI:
        "https://api.binance.com/api/v3",

    websocket:
        "wss://stream.binance.com:9443/ws/xauusdt@ticker",

    reconnectDelay: 3000,

    priceRefreshFallback: 5000

};


/* =========================================================
   2. GOLD PIP MODEL
========================================================= */

const GOLD_PIP_SIZE = 0.10;


/* =========================================================
   PRICE -> PIPS
========================================================= */

function priceToPips(priceDifference) {

    const value = Number(priceDifference);

    if (!Number.isFinite(value)) {

        return 0;

    }

    return Math.abs(value) / GOLD_PIP_SIZE;

}


/* =========================================================
   PIPS -> PRICE
========================================================= */

function pipsToPrice(pips) {

    const value = Number(pips);

    if (!Number.isFinite(value)) {

        return 0;

    }

    return value * GOLD_PIP_SIZE;

}


/* =========================================================
   3. APPLICATION STATE
========================================================= */

const marketState = {

    symbol: APP_CONFIG.symbol,

    price: null,

    previousPrice: null,

    change: 0,

    changePercent: 0,

    bid: null,

    ask: null,

    spread: null,

    connected: false,

    socket: null,

    reconnectTimer: null,

    fallbackTimer: null,

    lastUpdate: null,

    candles: [],

    timeframe: APP_CONFIG.defaultTimeframe,

    initialized: false

};


/* =========================================================
   4. SIGNAL STATE
========================================================= */

const signalState = {

    direction: "WAIT",

    bias: "NEUTRAL",

    confidence: 0,

    entry: null,

    stopLoss: null,

    takeProfit1: null,

    takeProfit2: null,

    takeProfit3: null,

    slPips: 0,

    tp1Pips: 0,

    tp2Pips: 0,

    tp3Pips: 0,

    riskReward: 0,

    reason: "Waiting for market confirmation.",

    timestamp: null

};


/* =========================================================
   5. TECHNICAL STATE
========================================================= */

const technicalState = {

    rsi: null,

    ema9: null,

    ema20: null,

    ema50: null,

    ema200: null,

    macd: null,

    macdSignal: null,

    macdHistogram: null,

    atr: null,

    adx: null,

    vwap: null,

    support: null,

    resistance: null,

    trend: "NEUTRAL",

    momentum: "NEUTRAL",

    volatility: "NORMAL",

    structure: "NEUTRAL",

    pattern: "NONE"

};


/* =========================================================
   6. PERFORMANCE STATE
========================================================= */

const performanceState = {

    totalSignals: 0,

    wins: 0,

    losses: 0,

    breakeven: 0,

    winRate: 0,

    profit: 0,

    loss: 0

};


/* =========================================================
   7. TRADE HISTORY
========================================================= */

let tradeHistory = [];


/* =========================================================
   LOAD LOCAL STORAGE SAFELY
========================================================= */

function loadSavedData() {

    try {

        const savedHistory =
            localStorage.getItem(
                "qayyum_gold_trade_history"
            );


        const savedPerformance =
            localStorage.getItem(
                "qayyum_gold_performance"
            );


        if (savedHistory) {

            const parsedHistory =
                JSON.parse(savedHistory);


            if (Array.isArray(parsedHistory)) {

                tradeHistory =
                    parsedHistory;

            }

        }


        if (savedPerformance) {

            const parsedPerformance =
                JSON.parse(savedPerformance);


            if (
                parsedPerformance &&
                typeof parsedPerformance === "object"
            ) {

                Object.assign(
                    performanceState,
                    parsedPerformance
                );

            }

        }

    }

    catch (error) {

        console.warn(
            "Saved dashboard data could not be loaded:",
            error
        );

    }

}


/* =========================================================
   SAVE TRADE HISTORY
========================================================= */

function saveTradeHistory() {

    try {

        localStorage.setItem(

            "qayyum_gold_trade_history",

            JSON.stringify(
                tradeHistory
            )

        );

    }

    catch (error) {

        console.warn(
            "Trade history save failed:",
            error
        );

    }

}


/* =========================================================
   SAVE PERFORMANCE
========================================================= */

function savePerformance() {

    try {

        localStorage.setItem(

            "qayyum_gold_performance",

            JSON.stringify(
                performanceState
            )

        );

    }

    catch (error) {

        console.warn(
            "Performance save failed:",
            error
        );

    }

}


/* =========================================================
   8. DOM HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setText(id, value) {

    const element =
        getElement(id);


    if (!element) {

        return;

    }


    element.textContent =
        value;

}


/* =========================================================
   SAFE CLASS UPDATE
========================================================= */

function setClass(
    id,
    className
) {

    const element =
        getElement(id);


    if (!element) {

        return;

    }


    element.className =
        className;

}


/* =========================================================
   9. NUMBER HELPERS
========================================================= */

function safeNumber(value) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;

}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(price) {

    const value =
        safeNumber(price);


    if (value === null) {

        return "--";

    }


    return value.toLocaleString(
        "en-US",
        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    );

}


/* =========================================================
   PIP FORMAT
========================================================= */

function formatPips(pips) {

    const value =
        safeNumber(pips);


    if (value === null) {

        return "--";

    }


    return (
        Math.round(value) +
        " PIPS"
    );

}


/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(value) {

    const number =
        safeNumber(value);


    if (number === null) {

        return "--";

    }


    const sign =
        number >= 0
            ? ""
            : "-";


    return (
        sign +
        "$" +
        Math.abs(number).toFixed(2)
    );

}


/* =========================================================
   PERCENT FORMAT
========================================================= */

function formatPercent(value) {

    const number =
        safeNumber(value);


    if (number === null) {

        return "--";

    }


    return number.toFixed(2) + "%";

}


/* =========================================================
   10. CONNECTION STATUS
========================================================= */

function updateConnectionStatus(
    connected
) {

    marketState.connected =
        Boolean(connected);


    const textElement =
        getElement(
            "market-status-text"
        );


    const statusElement =
        getElement(
            "connection-status"
        );


    if (connected) {

        if (textElement) {

            textElement.textContent =
                "MARKET LIVE";

        }


        if (statusElement) {

            statusElement.textContent =
                "LIVE";

            statusElement.classList.remove(
                "offline"
            );

            statusElement.classList.add(
                "online"
            );

        }

    }

    else {

        if (textElement) {

            textElement.textContent =
                "MARKET OFFLINE";

        }


        if (statusElement) {

            statusElement.textContent =
                "OFFLINE";

            statusElement.classList.remove(
                "online"
            );

            statusElement.classList.add(
                "offline"
            );

        }

    }

}


/* =========================================================
   11. UPDATE LIVE PRICE
========================================================= */

function updateLivePrice(price) {

    const value =
        safeNumber(price);


    if (value === null) {

        return;

    }


    marketState.previousPrice =
        marketState.price;


    marketState.price =
        value;


    marketState.lastUpdate =
        new Date();


    /* -----------------------------------------
       Main price
    ----------------------------------------- */

    setText(
        "gold-price",
        "$" + formatPrice(value)
    );


    /* -----------------------------------------
       Alternative IDs
    ----------------------------------------- */

    setText(
        "xau-price",
        "$" + formatPrice(value)
    );


    setText(
        "live-price",
        "$" + formatPrice(value)
    );


    /* -----------------------------------------
       Calculate tick-to-tick movement
    ----------------------------------------- */

    if (
        marketState.previousPrice !== null
    ) {

        marketState.change =
            value -
            marketState.previousPrice;


        if (
            marketState.previousPrice !== 0
        ) {

            marketState.changePercent =

                (
                    marketState.change /
                    marketState.previousPrice
                ) *
                100;

        }

    }


    updatePriceChange();

    updateMarketMeta();

    updatePriceTimestamp();

}


/* =========================================================
   12. PRICE CHANGE
========================================================= */

function updatePriceChange() {

    const element =
        getElement(
            "gold-change"
        );


    if (!element) {

        return;

    }


    const change =
        marketState.change;


    const percent =
        marketState.changePercent;


    const sign =
        change > 0
            ? "+"
            : "";


    element.textContent =

        sign +
        change.toFixed(2) +
        " (" +
        sign +
        percent.toFixed(2) +
        "%)";


    element.classList.remove(
        "up",
        "down",
        "positive",
        "negative",
        "neutral"
    );


    if (change > 0) {

        element.classList.add(
            "up"
        );

    }

    else if (change < 0) {

        element.classList.add(
            "down"
        );

    }

    else {

        element.classList.add(
            "neutral"
        );

    }

}


/* =========================================================
   13. MARKET META
========================================================= */

function updateMarketMeta() {

    setText(
        "gold-bid",
        marketState.bid !== null
            ? formatPrice(marketState.bid)
            : marketState.price !== null
                ? formatPrice(marketState.price)
                : "--"
    );


    setText(
        "gold-ask",
        marketState.ask !== null
            ? formatPrice(marketState.ask)
            : marketState.price !== null
                ? formatPrice(marketState.price)
                : "--"
    );


    setText(
        "gold-spread",
        marketState.spread !== null
            ? marketState.spread.toFixed(2)
            : "--"
    );

}


/* =========================================================
   14. PRICE TIMESTAMP
========================================================= */

function updatePriceTimestamp() {

    if (
        !marketState.lastUpdate
    ) {

        return;

    }


    const time =
        marketState.lastUpdate.toLocaleTimeString(
            "en-GB",
            {
                hour12: false
            }
        );


    setText(
        "price-updated",
        time
    );

}


/* =========================================================
   15. MARKET SESSION
========================================================= */

function updateMarketSession() {

    const element =
        getElement(
            "market-session"
        );


    if (!element) {

        return;

    }


    const now =
        new Date();


    const hour =
        now.getUTCHours();


    let session =
        "GLOBAL";


    /*
       Approximate forex session windows.
       This is informational only.
    */

    if (
        hour >= 0 &&
        hour < 8
    ) {

        session =
            "ASIA";

    }

    else if (
        hour >= 8 &&
        hour < 13
    ) {

        session =
            "LONDON";

    }

    else if (
        hour >= 13 &&
        hour < 17
    ) {

        session =
            "LONDON / NEW YORK";

    }

    else if (
        hour >= 17 &&
        hour < 22
    ) {

        session =
            "NEW YORK";

    }

    else {

        session =
            "ASIA / PACIFIC";

    }


    element.textContent =
        session;

}


/* =========================================================
   16. CLOCK
========================================================= */

function updateMarketClock() {

    const element =
        getElement(
            "market-clock"
        );


    if (!element) {

        return;

    }


    const now =
        new Date();


    element.textContent =
        now.toLocaleTimeString(
            "en-GB",
            {
                hour12: false
            }
        );

}


/* =========================================================
   17. INITIAL REST PRICE
========================================================= */

async function getInitialGoldPrice() {

    try {

        const response =
            await fetch(

                APP_CONFIG.restAPI +
                "/ticker/price?symbol=" +
                APP_CONFIG.symbol,

                {
                    method: "GET",

                    cache: "no-store"
                }

            );


        if (!response.ok) {

            throw new Error(
                "REST price request failed: " +
                response.status
            );

        }


        const data =
            await response.json();


        const price =
            safeNumber(
                data.price
            );


        if (price !== null) {

            updateLivePrice(
                price
            );

            return true;

        }

    }

    catch (error) {

        console.warn(
            "Initial XAUUSDT price unavailable:",
            error
        );

    }


    return false;

}


/* =========================================================
   18. BINANCE WEBSOCKET
========================================================= */

function startGoldWebSocket() {

    /*
       Prevent duplicate sockets.
    */

    if (
        marketState.socket &&
        (
            marketState.socket.readyState ===
            WebSocket.OPEN ||

            marketState.socket.readyState ===
            WebSocket.CONNECTING
        )
    ) {

        return;

    }


    console.log(
        "Connecting XAUUSDT WebSocket..."
    );


    updateConnectionStatus(
        false
    );


    try {

        const socket =
            new WebSocket(
                APP_CONFIG.websocket
            );


        marketState.socket =
            socket;


        /* -----------------------------------------
           OPEN
        ----------------------------------------- */

        socket.onopen =
            function() {

                console.log(
                    "XAUUSDT WebSocket connected."
                );


                updateConnectionStatus(
                    true
                );


                stopPriceFallback();

            };


        /* -----------------------------------------
           MESSAGE
        ----------------------------------------- */

        socket.onmessage =
            function(event) {

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );


                    /*
                       Binance ticker:

                       c = last price
                       b = best bid
                       a = best ask
                    */

                    const lastPrice =
                        safeNumber(
                            data.c
                        );


                    const bid =
                        safeNumber(
                            data.b
                        );


                    const ask =
                        safeNumber(
                            data.a
                        );


                    if (
                        lastPrice !== null
                    ) {

                        updateLivePrice(
                            lastPrice
                        );

                    }


                    if (
                        bid !== null
                    ) {

                        marketState.bid =
                            bid;

                    }


                    if (
                        ask !== null
                    ) {

                        marketState.ask =
                            ask;

                    }


                    if (
                        bid !== null &&
                        ask !== null
                    ) {

                        marketState.spread =
                            ask - bid;

                    }


                    updateMarketMeta();

                }

                catch (error) {

                    console.error(
                        "WebSocket data parsing error:",
                        error
                    );

                }

            };


        /* -----------------------------------------
           ERROR
        ----------------------------------------- */

        socket.onerror =
            function(error) {

                console.warn(
                    "XAUUSDT WebSocket error.",
                    error
                );


                updateCo



/* =========================================================
   QAYYUM OFFICIALZ GOLD TERMINAL
   JAVASCRIPT — PART 2

   ADVANCED GOLD TECHNICAL ENGINE

   Indicators:
   - EMA 9 / 20 / 50 / 200
   - RSI
   - MACD
   - ATR
   - ADX
   - VWAP
   - Bollinger Bands
   - Stochastic
   - Momentum
   - Volume analysis

   Technical concepts:
   - Trend
   - Momentum
   - Volatility
   - Support / Resistance
   - Market structure foundation
========================================================= */


/* =========================================================
   1. TECHNICAL CONFIGURATION
========================================================= */

const TECH_CONFIG = {

    rsiPeriod: 14,

    emaFast: 9,

    ema20: 20,

    ema50: 50,

    ema200: 200,

    macdFast: 12,

    macdSlow: 26,

    macdSignal: 9,

    atrPeriod: 14,

    adxPeriod: 14,

    bollingerPeriod: 20,

    bollingerDeviation: 2,

    stochasticPeriod: 14,

    stochasticSignal: 3,

    momentumPeriod: 10,

    volumePeriod: 20,

    minimumCandles: 220

};


/* =========================================================
   2. NUMBER HELPER
========================================================= */

function toNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   3. CLAMP VALUE
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(value, min),
        max
    );

}


/* =========================================================
   4. EXTRACT CLOSE PRICES
========================================================= */

function getClosePrices(candles) {

    if (!Array.isArray(candles)) {

        return [];

    }

    return candles.map(
        candle => toNumber(
            candle.close
        )
    );

}


/* =========================================================
   5. EXTRACT HIGH PRICES
========================================================= */

function getHighPrices(candles) {

    if (!Array.isArray(candles)) {

        return [];

    }

    return candles.map(
        candle => toNumber(
            candle.high
        )
    );

}


/* =========================================================
   6. EXTRACT LOW PRICES
========================================================= */

function getLowPrices(candles) {

    if (!Array.isArray(candles)) {

        return [];

    }

    return candles.map(
        candle => toNumber(
            candle.low
        )
    );

}


/* =========================================================
   7. EXTRACT VOLUME
========================================================= */

function getVolumes(candles) {

    if (!Array.isArray(candles)) {

        return [];

    }

    return candles.map(
        candle => toNumber(
            candle.volume
        )
    );

}


/* =========================================================
   8. SIMPLE MOVING AVERAGE
========================================================= */

function calculateSMA(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return null;

    }


    let sum = 0;


    for (
        let i = values.length - period;
        i < values.length;
        i++
    ) {

        sum +=
            toNumber(values[i]);

    }


    return sum / period;

}


/* =========================================================
   9. EMA SERIES
========================================================= */

function calculateEMASeries(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return [];

    }


    const multiplier =
        2 / (period + 1);


    const series = [];


    let ema =
        calculateSMA(
            values.slice(0, period),
            period
        );


    if (ema === null) {

        return [];

    }


    series.push(ema);


    for (
        let i = period;
        i < values.length;
        i++
    ) {

        ema =
            (
                values[i] -
                ema
            ) *
            multiplier +
            ema;


        series.push(ema);

    }


    return series;

}


/* =========================================================
   10. CURRENT EMA
========================================================= */

function calculateEMA(
    values,
    period
) {

    const series =
        calculateEMASeries(
            values,
            period
        );


    if (!series.length) {

        return null;

    }


    return series[
        series.length - 1
    ];

}


/* =========================================================
   11. RSI
========================================================= */

function calculateRSI(
    values,
    period = 14
) {

    if (
        !Array.isArray(values) ||
        values.length <= period
    ) {

        return null;

    }


    let gains = 0;

    let losses = 0;


    for (
        let i = 1;
        i <= period;
        i++
    ) {

        const difference =
            values[i] -
            values[i - 1];


        if (difference > 0) {

            gains += difference;

        }

        else {

            losses +=
                Math.abs(difference);

        }

    }


    let averageGain =
        gains / period;


    let averageLoss =
        losses / period;


    for (
        let i = period + 1;
        i < values.length;
        i++
    ) {

        const difference =
            values[i] -
            values[i - 1];


        const gain =
            difference > 0
                ? difference
                : 0;


        const loss =
            difference < 0
                ? Math.abs(difference)
                : 0;


        averageGain =
            (
                (
                    averageGain *
                    (period - 1)
                ) +
                gain
            ) / period;


        averageLoss =
            (
                (
                    averageLoss *
                    (period - 1)
                ) +
                loss
            ) / period;

    }


    if (averageLoss === 0) {

        return 100;

    }


    const relativeStrength =
        averageGain /
        averageLoss;


    return (
        100 -
        (
            100 /
            (1 + relativeStrength)
        )
    );

}


/* =========================================================
   12. TRUE RANGE
========================================================= */

function calculateTrueRange(
    candles
) {

    if (
        !Array.isArray(candles) ||
        candles.length < 2
    ) {

        return [];

    }


    const result = [];


    for (
        let i = 1;
        i < candles.length;
        i++
    ) {

        const current =
            candles[i];

        const previous =
            candles[i - 1];


        const high =
            toNumber(
                current.high
            );


        const low =
            toNumber(
                current.low
            );


        const previousClose =
            toNumber(
                previous.close
            );


        const range1 =
            high - low;


        const range2 =
            Math.abs(
                high -
                previousClose
            );


        const range3 =
            Math.abs(
                low -
                previousClose
            );


        result.push(
            Math.max(
                range1,
                range2,
                range3
            )
        );

    }


    return result;

}


/* =========================================================
   13. ATR
========================================================= */

function calculateATR(
    candles,
    period = 14
) {

    const trueRanges =
        calculateTrueRange(
            candles
        );


    if (
        trueRanges.length < period
    ) {

        return null;

    }


    let atr =
        calculateSMA(
            trueRanges.slice(
                0,
                period
            ),
            period
        );


    if (atr === null) {

        return null;

    }


    for (
        let i = period;
        i < trueRanges.length;
        i++
    ) {

        atr =
            (
                (
                    atr *
                    (period - 1)
                ) +
                trueRanges[i]
            ) / period;

    }


    return atr;

}


/* =========================================================
   14. MACD
========================================================= */

function calculateMACD(
    values,
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
) {

    if (
        !Array.isArray(values) ||
        values.length <
        slowPeriod + signalPeriod
    ) {

        return null;

    }


    const fastSeries =
        calculateEMASeries(
            values,
            fastPeriod
        );


    const slowSeries =
        calculateEMASeries(
            values,
            slowPeriod
        );


    if (
        !fastSeries.length ||
        !slowSeries.length
    ) {

        return null;

    }


    /*
       Align EMA series.

       Slow EMA starts later than
       fast EMA, therefore remove
       the extra fast values.
    */

    const offset =
        fastPeriod -
        slowPeriod;


    const alignedFast =
        offset < 0
            ? fastSeries
            : fastSeries.slice(
                offset
            );


    const macdSeries = [];


    const length =
        Math.min(
            alignedFast.length,
            slowSeries.length
        );


    for (
        let i = 0;
        i < length;
        i++
    ) {

        macdSeries.push(
            alignedFast[i] -
            slowSeries[i]
        );

    }


    if (
        macdSeries.length <
        signalPeriod
    ) {

        return null;

    }


    const signalSeries =
        calculateEMASeries(
            macdSeries,
            signalPeriod
        );


    if (!signalSeries.length) {

        return null;

    }


    const macd =
        macdSeries[
            macdSeries.length - 1
        ];


    const signal =
        signalSeries[
            signalSeries.length - 1
        ];


    const histogram =
        macd - signal;


    return {

        macd,

        signal,

        histogram

    };

}


/* =========================================================
   15. BOLLINGER BANDS
========================================================= */

function calculateBollingerBands(
    values,
    period = 20,
    deviationMultiplier = 2
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return null;

    }


    const recent =
        values.slice(
            values.length - period
        );


    const middle =
        calculateSMA(
            recent,
            period
        );


    if (middle === null) {

        return null;

    }


    let variance = 0;


    for (
        const value of recent
    ) {

        variance +=
            Math.pow(
                value - middle,
                2
            );

    }


    variance /=
        period;


    const standardDeviation =
        Math.sqrt(
            variance
        );


    const upper =
        middle +
        (
            standardDeviation *
            deviationMultiplier
        );


    const lower =
        middle -
        (
            standardDeviation *
            deviationMultiplier
        );


    const current =
        values[
            values.length - 1
        ];


    const bandwidth =
        upper !== lower
            ? (
                (
                    upper -
                    lower
                ) /
                middle
            ) * 100
            : 0;


    return {

        middle,

        upper,

        lower,

        bandwidth,

        current

    };

}


/* =========================================================
   16. STOCHASTIC OSCILLATOR
========================================================= */

function calculateStochastic(
    candles,
    period = 14,
    signalPeriod = 3
) {

    if (
        !Array.isArray(candles) ||
        candles.length < period
    ) {

        return null;

    }


    const recent =
        candles.slice(
            candles.length - period
        );


    let highest =
        -Infinity;


    let lowest =
        Infinity;


    for (
        const candle of recent
    ) {

        highest =
            Math.max(
                highest,
                toNumber(candle.high)
            );


        lowest =
            Math.min(
                lowest,
                toNumber(candle.low)
            );

    }


    const close =
        toNumber(
            candles[
                candles.length - 1
            ].close
        );


    if (
        highest === lowest
    ) {

        return {

            k: 50,

            d: 50

        };

    }


    const k =
        (
            (
                close -
                lowest
            ) /
            (
                highest -
                lowest
            )
        ) * 100;


    /*
       Approximate D line from
       recent stochastic values.
    */

    const kValues = [];


    const start =
        Math.max(
            0,
            candles.length -
            period -
            signalPeriod +
            1
        );


    for (
        let i = start;
        i < candles.length;
        i++
    ) {

        const windowStart =
            Math.max(
                0,
                i - period + 1
            );


        const window =
            candles.slice(
                windowStart,
                i + 1
            );


        let high =
            -Infinity;


        let low =
            Infinity;


        for (
            const candle of window
        ) {

            high =
                Math.max(
                    high,
                    toNumber(
                        candle.high
                    )
                );


            low =
                Math.min(
                    low,
                    toNumber(
                        candle.low
                    )
                );

        }


        const c =
            toNumber(
                candles[i].close
            );


        const currentK =
            high === low
                ? 50
                : (
                    (
                        c - low
                    ) /
                    (
                        high - low
                    )
                ) * 100;


        kValues.push(
            currentK
        );

    }


    const d =
        kValues.length >= signalPeriod
            ? calculateSMA(
                kValues,
                signalPeriod
            )
            : k;


    return {

        k,

        d

    };

}


/* =========================================================
   17. MOMENTUM
========================================================= */

function calculateMomentum(
    values,
    period = 10
) {

    if (
        !Array.isArray(values) ||
        values.length <= period
    ) {

        return null;

    }


    const current =
        values[
            values.length - 1
        ];


    const previous =
        values[
            values.length -
            1 -
            period
        ];


    return current - previous;

}


/* =========================================================
   18. VWAP
========================================================= */

function calculateVWAP(
    candles
) {

    if (
        !Array.isArray(candles) ||
        candles.length === 0
    ) {

        return null;

    }


    let cumulativePriceVolume = 0;

    let cumulativeVolume = 0;


    /*
       For dashboard analysis,
       calculate session-style VWAP
       from supplied candles.
    */

    for (
        const candle of candles
    ) {

        const high =
            toNumber(
                candle.high
            );


        const low =
            toNumber(
                candle.low
            );


        const close =
            toNumber(
                candle.close
            );


        const volume =
            toNumber(
                candle.volume
            );


        const typicalPrice =
            (
                high +
                low +
                close
            ) / 3;


        cumulativePriceVolume +=
            typicalPrice *
            volume;


        cumulativeVolume +=
            volume;

    }


    if (
        cumulativeVolume === 0
    ) {

        return null;

    }


    return (
        cumulativePriceVolume /
        cumulativeVolume
    );

}


/* =========================================================
   19. ADX
========================================================= */

function calculateADX(
    candles,
    period = 14
) {

    if (
        !Array.isArray(candles) ||
        candles.length <
        period * 2
    ) {

        return null;

    }


    const trueRanges = [];

    const plusDM = [];

    const minusDM = [];


    for (
        let i = 1;
        i < candles.length;
        i++
    ) {

        const current =
            candles[i];


        const previous =
            candles[i - 1];


        const high =
            toNumber(
                current.high
            );


        const low =
            toNumber(
                current.low
            );


        const previousHigh =
            toNumber(
                previous.high
            );


        const previousLow =
            toNumber(
                previous.low
            );


        const previousClose =
            toNumber(
                previous.close
            );


        const tr =
            Math.max(
                high - low,
                Math.abs(
                    high -
                    previousClose
                ),
                Math.abs(
                    low -
                    previousClose
                )
            );


        const upwardMove =
            high -
            previousHigh;


        const downwardMove =
            previousLow -
            low;


        let positiveDM = 0;

        let negativeDM = 0;


        if (
            upwardMove > downwardMove &&
            upwardMove > 0
        ) {

            positiveDM =
                upwardMove;

        }


        if (
            downwardMove > upwardMove &&
            downwardMove > 0
        ) {

            negativeDM =
                downwardMove;

        }


        trueRanges.push(tr);

        plusDM.push(
            positiveDM
        );

        minusDM.push(
            negativeDM
        );

    }


    if (
        trueRanges.length <
        period
    ) {

        return null;

    }


    let trAverage =
        calculateSMA(
            trueRanges.slice(
                0,
                period
            ),
            period
        );


    let plusAverage =
        calculateSMA(
            plusDM.slice(
                0,
                period
            ),
            period
        );


    let minusAverage =
        calculateSMA(
            minusDM.slice(
                0,
                period
            ),
            period
        );


    const dxValues = [];


    for (
        let i = period;
        i < trueRanges.length;
        i++
    ) {

        trAverage =
            (
                (
                    trAverage *
                    (period - 1)
                ) +
                trueRanges[i]
            ) / period;


        plusAverage =
            (
                (
                    plusAverage *
                    (period - 1)
                ) +
                plusDM[i]




/* =========================================================
   QAYYUM OFFICIALZ GOLD TERMINAL
   JAVASCRIPT — PART 2

   MARKET DATA ENGINE
   CANDLE DATA
   EMA
   RSI
   MACD
   ATR
   ADX
   VWAP
   SUPPORT / RESISTANCE
   MARKET STRUCTURE
========================================================= */


/* =========================================================
   1. INDICATOR CONFIGURATION
========================================================= */

const INDICATOR_CONFIG = {

    emaFast: 20,

    emaMedium: 50,

    emaSlow: 200,

    rsiPeriod: 14,

    macdFast: 12,

    macdSlow: 26,

    macdSignal: 9,

    atrPeriod: 14,

    adxPeriod: 14,

    volumePeriod: 20,

    structureLookback: 50,

    supportLookback: 80,

    resistanceLookback: 80

};


/* =========================================================
   2. ANALYSIS STATE
========================================================= */

const analysisState = {

    timeframe: "15m",

    indicators: {

        ema20: null,

        ema50: null,

        ema200: null,

        rsi: null,

        macd: null,

        macdSignal: null,

        macdHistogram: null,

        atr: null,

        adx: null,

        vwap: null

    },

    structure: {

        trend: "NEUTRAL",

        marketStructure: "WAIT",

        support: null,

        resistance: null,

        higherHigh: false,

        higherLow: false,

        lowerHigh: false,

        lowerLow: false,

        pattern: "NONE"

    },

    momentum: "NEUTRAL",

    volatility: "NORMAL",

    lastAnalysis: null

};


/* =========================================================
   3. BINANCE KLINE URL
========================================================= */

function getKlineURL(
    timeframe = analysisState.timeframe,
    limit = CONFIG.candleLimit
) {

    return (
        CONFIG.apiURL +
        "/klines?symbol=" +
        CONFIG.symbol +
        "&interval=" +
        timeframe +
        "&limit=" +
        limit
    );

}


/* =========================================================
   4. FETCH HISTORICAL CANDLES
========================================================= */

async function fetchGoldCandles(
    timeframe = analysisState.timeframe
) {

    try {

        const response =
            await fetch(
                getKlineURL(
                    timeframe,
                    CONFIG.candleLimit
                )
            );


        if (!response.ok) {

            throw new Error(
                "Candle request failed"
            );

        }


        const raw =
            await response.json();


        if (!Array.isArray(raw)) {

            throw new Error(
                "Invalid candle data"
            );

        }


        const candles =
            raw.map(
                function(candle) {

                    return {

                        time:
                            Number(candle[0]),

                        open:
                            Number(candle[1]),

                        high:
                            Number(candle[2]),

                        low:
                            Number(candle[3]),

                        close:
                            Number(candle[4]),

                        volume:
                            Number(candle[5]),

                        closeTime:
                            Number(candle[6])

                    };

                }
            );


        market.candles =
            candles;


        return candles;

    }

    catch(error) {

        console.error(
            "Gold candle error:",
            error
        );


        return [];

    }

}


/* =========================================================
   5. EXTRACT CLOSE PRICES
========================================================= */

function getClosePrices(candles) {

    return candles
        .map(
            candle =>
                Number(candle.close)
        )
        .filter(
            price =>
                Number.isFinite(price)
        );

}


/* =========================================================
   6. EXTRACT HIGH PRICES
========================================================= */

function getHighPrices(candles) {

    return candles
        .map(
            candle =>
                Number(candle.high)
        )
        .filter(
            price =>
                Number.isFinite(price)
        );

}


/* =========================================================
   7. EXTRACT LOW PRICES
========================================================= */

function getLowPrices(candles) {

    return candles
        .map(
            candle =>
                Number(candle.low)
        )
        .filter(
            price =>
                Number.isFinite(price)
        );

}


/* =========================================================
   8. SIMPLE MOVING AVERAGE
========================================================= */

function calculateSMA(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return null;

    }


    const slice =
        values.slice(
            values.length - period
        );


    const sum =
        slice.reduce(
            (
                total,
                value
            ) =>
                total + Number(value),
            0
        );


    return sum / period;

}


/* =========================================================
   9. EMA
========================================================= */

function calculateEMA(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return null;

    }


    const multiplier =
        2 /
        (period + 1);


    let ema =
        calculateSMA(
            values.slice(
                0,
                period
            ),
            period
        );


    if (ema === null) {

        return null;

    }


    for (
        let i = period;
        i < values.length;
        i++
    ) {

        const price =
            Number(values[i]);


        ema =
            (
                price - ema
            ) *
            multiplier +
            ema;

    }


    return ema;

}


/* =========================================================
   10. EMA SERIES
========================================================= */

function calculateEMASeries(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return [];

    }


    const multiplier =
        2 /
        (period + 1);


    let ema =
        calculateSMA(
            values.slice(
                0,
                period
            ),
            period
        );


    const series =
        new Array(
            period - 1
        ).fill(null);


    series.push(ema);


    for (
        let i = period;
        i < values.length;
        i++
    ) {

        ema =
            (
                Number(values[i]) -
                ema
            ) *
            multiplier +
            ema;


        series.push(ema);

    }


    return series;

}


/* =========================================================
   11. RSI
========================================================= */

function calculateRSI(
    values,
    period = 14
) {

    if (
        !Array.isArray(values) ||
        values.length <= period
    ) {

        return null;

    }


    let gains = 0;

    let losses = 0;


    for (
        let i = 1;
        i <= period;
        i++
    ) {

        const change =
            values[i] -
            values[i - 1];


        if (change > 0) {

            gains += change;

        }

        else {

            losses +=
                Math.abs(change);

        }

    }


    let averageGain =
        gains / period;


    let averageLoss =
        losses / period;


    for (
        let i = period + 1;
        i < values.length;
        i++
    ) {

        const change =
            values[i] -
            values[i - 1];


        const gain =
            change > 0
                ? change
                : 0;


        const loss =
            change < 0
                ? Math.abs(change)
                : 0;


        averageGain =
            (
                (
                    averageGain *
                    (period - 1)
                ) +
                gain
            ) /
            period;


        averageLoss =
            (
                (
                    averageLoss *
                    (period - 1)
                ) +
                loss
            ) /
            period;

    }


    if (averageLoss === 0) {

        return 100;

    }


    const relativeStrength =
        averageGain /
        averageLoss;


    return (
        100 -
        (
            100 /
            (
                1 +
                relativeStrength
            )
        )
    );

}


/* =========================================================
   12. TRUE RANGE
========================================================= */

function calculateTrueRange(
    candles
) {

    const tr = [];


    for (
        let i = 0;
        i < candles.length;
        i++
    ) {

        const current =
            candles[i];


        if (i === 0) {

            tr.push(
                current.high -
                current.low
            );

            continue;

        }


        const previous =
            candles[i - 1];


        const range1 =
            current.high -
            current.low;


        const range2 =
            Math.abs(
                current.high -
                previous.close
            );


        const range3 =
            Math.abs(
                current.low -
                previous.close
            );


        tr.push(
            Math.max(
                range1,
                range2,
                range3
            )
        );

    }


    return tr;

}


/* =========================================================
   13. ATR
========================================================= */

function calculateATR(
    candles,
    period = 14
) {

    if (
        !Array.isArray(candles) ||
        candles.length < period
    ) {

        return null;

    }


    const trueRanges =
        calculateTrueRange(
            candles
        );


    return calculateSMA(
        trueRanges,
        period
    );

}


/* =========================================================
   14. MACD
========================================================= */

function calculateMACD(
    values,
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
) {

    if (
        !Array.isArray(values) ||
        values.length < slowPeriod
    ) {

        return null;

    }


    const fastSeries =
        calculateEMASeries(
            values,
            fastPeriod
        );


    const slowSeries =
        calculateEMASeries(
            values,
            slowPeriod
        );


    const macdSeries = [];


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        if (
            fastSeries[i] === null ||
            slowSeries[i] === null
        ) {

            macdSeries.push(
                null
            );

        }

        else {

            macdSeries.push(
                fastSeries[i] -
                slowSeries[i]
            );

        }

    }


    const validMACD =
        macdSeries.filter(
            value =>
                value !== null
        );


    if (
        validMACD.length <
        signalPeriod
    ) {

        return null;

    }


    const signal =
        calculateEMA(
            validMACD,
            signalPeriod
        );


    const macd =
        validMACD[
            validMACD.length - 1
        ];


    const histogram =
        macd -
        signal;


    return {

        value: macd,

        signal: signal,

        histogram: histogram

    };

}


/* =========================================================
   15. ADX / DIRECTIONAL MOVEMENT
========================================================= */

function calculateADX(
    candles,
    period = 14
) {

    if (
        !Array.isArray(candles) ||
        candles.length <
        period * 2
    ) {

        return null;

    }


    const trueRanges = [];

    const plusDM = [];

    const minusDM = [];


    for (
        let i = 1;
        i < candles.length;
        i++
    ) {

        const current =
            candles[i];

        const previous =
            candles[i - 1];


        const highDifference =
            current.high -
            previous.high;


        const lowDifference =
            previous.low -
            current.low;


        let positiveDM = 0;

        let negativeDM = 0;


        if (
            highDifference >
                lowDifference &&
            highDifference > 0
        ) {

            positiveDM =
                highDifference;

        }


        if (
            lowDifference >
                highDifference &&
            lowDifference > 0
        ) {

            negativeDM =
                lowDifference;

        }


        const trueRange =
            Math.max(

                current.high -
                current.low,

                Math.abs(
                    current.high -
                    previous.close
                ),

                Math.abs(
                    current.low -
                    previous.close
                )

            );


        trueRanges.push(
            trueRange
        );


        plusDM.push(
            positiveDM
        );


        minusDM.push(
            negativeDM
        );

    }


    if (
        trueRanges.length <
        period
    ) {

        return null;

    }


    const atr =
        calculateSMA(
            trueRanges,
            period
        );


    const plus =
        calculateSMA(
            plusDM,
            period
        );


    const minus =
        calculateSMA(
            minusDM,
            period
        );


    if (
        !atr ||
        atr === 0
    ) {

        return null;

    }


    const plusDI =
        (
            plus /
            atr
        ) *
        100;


    const minusDI =
        (
            minus /
            atr
        ) *
        100;


    const denominator =
        plusDI +
        minusDI;


    if (
        denominator === 0
    ) {

        return 0;

    }


    const dx =
        (
            Math.abs(
                plusDI -
                minusDI
            ) /
            denominator
        ) *
        100;


    return dx;

}


/* =========================================================
   16. VWAP
========================================================= */

function calculateVWAP(
    candles
) {

    if (
        !Array.isArray(candles) ||
        candles.length === 0
    ) {

        return null;

    }


    let cumulativePriceVolume =
        0;


    let cumulativeVolume =
        0;


    for (
        const candle of candles
    ) {

        const typicalPrice =
            (
                candle.high +
                candle.low +
                candle.close
            ) / 3;


        const volume =
            Number(candle.volume);


        if (
            !Number.isFinite(volume)
        ) {

            continue;

        }


        cumulativePriceVolume +=
            typicalPrice *
            volume;


        cumulativeVolume +=
            volume;

    }


    if (
        cumulativeVolume === 0
    ) {

        return null;

    }


    return (
        cumulativePriceVolume /
        cumulativeVolume
    );

}


/* =========================================================
   17. SUPPORT DETECTION
========================================================= */

function detectSupport(
    candles,
    lookback =
        INDICATOR_CONFIG.supportLookback
) {

    if (
        !Array.isArray(candles) ||
        candles.length < 10
    ) {

        return null;

    }


    const recent =
        candles.slice(
            -lookback
        );


    let lowest =
        Infinity;


    for (
        const candle of recent
    ) {

        if (
            candle.low <
            lowest
        ) {

            lowest =
                candle.low;

        }

    }


    return Number.isFinite(
        lowest
    )
        ? lowest
        : null;

}


/* =========================================================
   18. RESISTANCE DETECTION
========================================================= */

function detectResistance(
    candles,
    lookback =
        INDICATOR_CONFIG.resistanceLookback
) {

    if (
        !Array.isArray(candles) ||
        candles.length < 10
    ) {

        return null;

    }


    const recent =
        candles.slice(
            -lookback
        );


    let highest =
        -Infinity;


    for (
        const candle of recent
    ) {

        if (
            candle.high >
            highest
        ) {

            highest =
                candle.high;

        }

    }


    return Number.isFinite(
        highest
    )
        ? highest
        : null;

}


/* =========================================================
   19. SWING HIGH
========================================================= */

function isSwingHigh(
    candles,
    index,
    strength = 2
) {

    if (
        index < strength ||
        index >=
            candles.length -
            strength
    ) {

        return false;

    }


    const current =
        candles[index].high;


    for (
        let i = 1;
        i <= strength;
        i++
    ) {

        if (
            current <=
                candles[index - i].high ||
            current <=
                candles[index + i].high
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   20. SWING LOW
========================================================= */

function isSwingLow(
    candles,
    index,
    strength = 2
) {

    if (
        index < strength ||
        index >=
            candles.length -
            strength
    ) {

        return false;

    }


    const current =
        candles[index].low;


    for (
        let i = 1;
        i <= strength;
        i++
    ) {

        if (
            current >=
                candles[index - i].low ||
            current >=
                candles[index + i].low
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   21. GET SWING POINTS
========================================================= */

function getSwingPoints(
    candles
) {

    const highs = [];

    const lows = [];


    for (
        let i = 2;
        i < candles.length - 2;
        i++
    ) {

        if (
            isSwingHigh(
                candles,
                i,
                2
            )
        ) {

            highs.push({

                index: i,

                price:
                    candles[i].high

            });

        }


        if (
            isSwingLow(
                candles,
                i,
                2
            )
        ) {

            lows.push({

                index: i,

                price:
                    candles[i].low

            });

        }

    }


    return {

        highs,

        lows

    };

}


/* =========================================================
   22. MARKET STRUCTURE
========================================================= */

function detectMarketStructure(
    candles
) {

    if (
        !Array.isArray(candles) ||
        candles.length < 20
    ) {

        return {

            trend: "NEUTRAL",

            marketStructure: "WAIT",

            support: null,

            resistance: null,





           /* =========================================================
   QAYYUM OFFICIALZ GOLD TERMINAL
   JAVASCRIPT — PART 4

   FINAL APPLICATION ENGINE

   FEATURES:
   - Signal generation
   - Technical + price-action scoring
   - Entry / SL / TP1 / TP2 / TP3
   - Risk management
   - Trade history
   - Win / Loss tracking
   - Calculator
   - Market structure UI
   - Live chart rendering
   - Timeframe switching
   - Dashboard synchronization
========================================================= */


/* =========================================================
   1. FINAL ENGINE STATE
========================================================= */

const engine = {

    timeframe: "15m",

    lastSignalTime: null,

    lastProcessedCandle: null,

    signalActive: false,

    signalId: null,

    support: null,

    resistance: null,

    structure: "NEUTRAL",

    pattern: "NONE",

    trend: "NEUTRAL",

    momentum: "NEUTRAL",

    volatility: "NORMAL",

    indicators: {},

    candles: [],

    chartCandleLimit: 120

};


/* =========================================================
   2. EXTRA PERFORMANCE STATE
========================================================= */

if (
    typeof performance !== "object" ||
    !performance
) {

    performance = {

        totalSignals: 0,
        wins: 0,
        losses: 0

    };

}


if (!Array.isArray(tradeHistory)) {

    tradeHistory = [];

}


/* =========================================================
   3. DOM READY HELPER
========================================================= */

function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function clamp(value, min, max) {

    return Math.min(
        max,
        Math.max(min, value)
    );

}


/* =========================================================
   4. FETCH HISTORICAL CANDLES
========================================================= */

async function fetchGoldCandles(
    timeframe = engine.timeframe
) {

    try {

        const url =
            CONFIG.apiURL +
            "/klines?symbol=" +
            CONFIG.symbol +
            "&interval=" +
            timeframe +
            "&limit=" +
            CONFIG.candleLimit;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Kline request failed"
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid candle data"
            );

        }


        engine.candles =
            data.map(function(candle) {

                return {

                    time: Number(candle[0]),

                    open: Number(candle[1]),

                    high: Number(candle[2]),

                    low: Number(candle[3]),

                    close: Number(candle[4]),

                    volume: Number(candle[5])

                };

            });


        market.candles =
            engine.candles;


        return engine.candles;

    }

    catch(error) {

        console.error(
            "Candle loading error:",
            error
        );

        return [];

    }

}


/* =========================================================
   5. SIMPLE MOVING AVERAGE
========================================================= */

function calculateSMA(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return null;

    }


    let sum = 0;


    for (
        let i = values.length - period;
        i < values.length;
        i++
    ) {

        sum += Number(values[i]);

    }


    return sum / period;

}


/* =========================================================
   6. EMA
========================================================= */

function calculateEMA(
    values,
    period
) {

    if (
        !Array.isArray(values) ||
        values.length < period
    ) {

        return null;

    }


    const multiplier =
        2 / (period + 1);


    let ema =
        calculateSMA(
            values.slice(0, period),
            period
        );


    if (ema === null) {

        return null;

    }


    for (
        let i = period;
        i < values.length;
        i++
    ) {

        ema =
            (
                values[i] - ema
            ) *
            multiplier +
            ema;

    }


    return ema;

}


/* =========================================================
   7. RSI
========================================================= */

function calculateRSI(
    closes,
    period = 14
) {

    if (
        closes.length <= period
    ) {

        return null;

    }


    let gains = 0;

    let losses = 0;


    for (
        let i = 1;
        i <= period;
        i++
    ) {

        const change =
            closes[i] -
            closes[i - 1];


        if (change >= 0) {

            gains += change;

        }

        else {

            losses += Math.abs(change);

        }

    }


    let averageGain =
        gains / period;


    let averageLoss =
        losses / period;


    for (
        let i = period + 1;
        i < closes.length;
        i++
    ) {

        const change =
            closes[i] -
            closes[i - 1];


        const gain =
            Math.max(change, 0);


        const loss =
            Math.max(-change, 0);


        averageGain =
            (
                averageGain *
                (period - 1) +
                gain
            ) / period;


        averageLoss =
            (
                averageLoss *
                (period - 1) +
                loss
            ) / period;

    }


    if (averageLoss === 0) {

        return 100;

    }


    const rs =
        averageGain /
        averageLoss;


    return 100 -
        (
            100 /
            (1 + rs)
        );

}


/* =========================================================
   8. ATR
========================================================= */

function calculateATR(
    candles,
    period = 14
) {

    if (
        candles.length <= period
    ) {

        return null;

    }


    const ranges = [];


    for (
        let i = 1;
        i < candles.length;
        i++
    ) {

        const current =
            candles[i];


        const previous =
            candles[i - 1];


        const trueRange =
            Math.max(

                current.high -
                current.low,

                Math.abs(
                    current.high -
                    previous.close
                ),

                Math.abs(
                    current.low -
                    previous.close
                )

            );


        ranges.push(
            trueRange
        );

    }


    return calculateSMA(
        ranges,
        period
    );

}


/* =========================================================
   9. MACD
========================================================= */

function calculateMACD(
    closes
) {

    if (closes.length < 35) {

        return null;

    }


    const ema12 =
        calculateEMA(
            closes,
            12
        );


    const ema26 =
        calculateEMA(
            closes,
            26
        );


    if (
        ema12 === null ||
        ema26 === null
    ) {

        return null;

    }


    const macd =
        ema12 - ema26;


    const macdValues = [];


    for (
        let i = 26;
        i < closes.length;
        i++
    ) {

        const shortSlice =
            closes.slice(
                0,
                i + 1
            );


        const fast =
            calculateEMA(
                shortSlice,
                12
            );


        const slow =
            calculateEMA(
                shortSlice,
                26
            );


        if (
            fast !== null &&
            slow !== null
        ) {

            macdValues.push(
                fast - slow
            );

        }

    }


    const signal =
        calculateEMA(
            macdValues,
            9
        );


    return {

        value: macd,

        signal:
            signal === null
                ? macd
                : signal,

        histogram:
            macd -
            (
                signal === null
                    ? macd
                    : signal
            )

    };

}


/* =========================================================
   10. VWAP
========================================================= */

function calculateVWAP(
    candles
) {

    if (
        !candles.length
    ) {

        return null;

    }


    let cumulativePriceVolume =
        0;


    let cumulativeVolume =
        0;


    for (
        let i = 0;
        i < candles.length;
        i++
    ) {

        const candle =
            candles[i];


        const typicalPrice =
            (
                candle.high +
                candle.low +
                candle.close
            ) / 3;


        cumulativePriceVolume +=
            typicalPrice *
            candle.volume;


        cumulativeVolume +=
            candle.volume;

    }


    if (
        cumulativeVolume === 0
    ) {

        return null;

    }


    return (
        cumulativePriceVolume /
        cumulativeVolume
    );

}


/* =========================================================
   11. ADX
========================================================= */

function calculateADX(
    candles,
    period = 14
) {

    if (
        candles.length <
        period * 2 + 2
    ) {

        return null;

    }


    const trs = [];

    const plusDM = [];

    const minusDM = [];


    for (
        let i = 1;
        i < candles.length;
        i++
    ) {

        const current =
            candles[i];


        const previous =
            candles[i - 1];


        const tr =
            Math.max(

                current.high -
                current.low,

                Math.abs(
                    current.high -
                    previous.close
                ),

                Math.abs(
                    current.low -
                    previous.close
                )

            );


        const upMove =
            current.high -
            previous.high;


        const downMove =
            previous.low -
            current.low;


        trs.push(tr);


        plusDM.push(
            upMove > downMove &&
            upMove > 0
                ? upMove
                : 0
        );


        minusDM.push(
            downMove > upMove &&
            downMove > 0
                ? downMove
                : 0
        );

    }


    const dxValues = [];


    for (
        let i = period;
        i < trs.length;
        i++
    ) {

        const trSlice =
            trs.slice(
                i - period,
                i
            );


        const plusSlice =
            plusDM.slice(
                i - period,
                i
            );


        const minusSlice =
            minusDM.slice(
                i - period,
                i
            );


        const atr =
            trSlice.reduce(
                (a, b) => a + b,
                0
            ) / period;


        if (atr === 0) {

            continue;

        }


        const plus =
            (
                plusSlice.reduce(
                    (a, b) => a + b,
                    0
                ) / period
            ) / atr * 100;


        const minus =
            (
                minusSlice.reduce(
                    (a, b) => a + b,
                    0
                ) / period
            ) / atr * 100;


        const denominator =
            plus + minus;


        if (
            denominator === 0
        ) {

            continue;

        }


        const dx =
            Math.abs(
                plus - minus
            ) /
            denominator *
            100;


        dxValues.push(dx);

    }


    if (
        !dxValues.length
    ) {

        return null;

    }


    return calculateSMA(
        dxValues,
        Math.min(
            period,
            dxValues.length
        )
    );

}


/* =========================================================
   12. PIVOT SUPPORT / RESISTANCE
========================================================= */

function detectSupportResistance(
    candles
) {

    if (
        candles.length < 30
    ) {

        return {

            support: null,

            resistance: null

        };

    }


    const recent =
        candles.slice(-50);


    let support =
        Infinity;


    let resistance =
        -Infinity;


    for (
        let i = 2;
        i < recent.length - 2;
        i++
    ) {

        const c =
            recent[i];


        const isLow =

            c.low <=
            recent[i - 1].low &&

            c.low <=
            recent[i - 2].low &&

            c.low <=
            recent[i + 1].low &&

            c.low <=
            recent[i + 2].low;


        const isHigh =

            c.high >=
            recent[i - 1].high &&

            c.high >=
            recent[i - 2].high &&

            c.high >=
            recent[i + 1].high &&

            c.high >=
            recent[i + 2].high;


        if (isLow) {

            support =
                Math.min(
                    support,
                    c.low
                );

        }


        if (isHigh) {

            resistance =
                Math.max(
                    resistance,
                    c.high
                );

        }

    }


    if (
        support === Infinity
    ) {

        support =
            Math.min(
                ...recent.map(
                    c => c.low
                )
            );

    }


    if (
        resistance === -Infinity
    ) {

        resistance =
            Math.max(
                ...recent.map(
                    c => c.high
                )
            );

    }


    return {

        support,

        resistance

    };

}


/* =========================================================
   13. MARKET STRUCTURE
========================================================= */

function detectMarketStructure(
    candles
) {

    if (
        candles.length < 20
    ) {

        return "NEUTRAL";

    }


    const recent =
        candles.slice(-12);


    const highs =
        recent.map(
            c => c.high
        );


    const lows =
        recent.map(
            c => c.low
        );


    const higherHigh =
        highs[highs.length - 1] >
        highs[0];


    const higherLow =
        lows[lows.length - 1] >
        lows[0];


    const lowerHigh =
        highs[highs.length - 1] <
        highs[0];


    const lowerLow =
        lows[lows.length - 1] <
        lows[0];


    if (
        higherHigh &&
        higherLow
    ) {

        return "BULLISH";

    }


    if (
        lowerHigh &&
        lowerLow
    ) {

        return "BEARISH";

    }


    return "RANGE";

}


/* =========================================================
   14. CANDLE PATTERN
========================================================= */

function detectPattern(
    candles
) {

    if (
        candles.length < 3
    ) {

        return "NONE";

    }


    const a =
        candles[candles.length - 3];


    const b =
        candles[candles.length - 2];


    const c =
        candles[candles.length - 1];


    const cBody =
        Math.abs(
            c.close - c.open
        );


    const cRange =
        c.high - c.low;


    if (
        cRange > 0 &&
        cBody / cRange < 0.25
    ) {

        return "INDECISION";

    }


    if (
        b.close < b.open &&
        c.close > c.open &&
        c.close > b.open &&
        c.open < b.close
    ) {

        return "BULLISH ENGULFING";

    }


    if (
        b.close > b.open &&
        c.close < c.open &&
        c.close < b.open &&
        c.open > b.close
    ) {

        return "BEARISH ENGULFING";

    }


    const lowerWick =
        Math.min(
            c.open,
            c.close
        ) - c.low;


    const upperWick =
        c.high -
        Math.max(
            c.open,
            c.close
        );


    if (
        lowerWick >
        cBody * 2 &&
        upperWick < cBody
    ) {

        return "BULLISH REJECTION";

    }


    if (
        upperWick >
        cBody * 2 &&
        lowerWick < cBody
    ) {

        return "BEARISH REJECTION";

    }


    return "NONE";

}


/* =========================================================
   15. INDICATOR ENGINE
========================================================= */

function calculateIndicators(
    candles
) {

    const closes =
        candles.map(
            c => c.close
        );


    const ema20 =
        calculateEMA(
            closes,
            20
        );


    const ema50 =
        calculateEMA(
            closes,
            50
        );


    const ema200 =
        calculateEMA(
            closes,
            200
        );


    const rsi =
        calculateRSI(
            closes,
            14
        );


    const atr =
        calculateATR(
            candles,
            14
        );


    const macd =
        calculateMACD(
            closes
        );


    const adx =
        calculateADX(
            candles,
            14
        );


    const vwap =
        calculateVWAP(
            candles
        );


    return {

        ema20,

        ema50,

        ema200,

        rsi,

        atr,

        macd,

        adx,

        vwap

    };

}


/* =========================================================
   16. SIGNAL SCORING ENGINE
========================================================= */

function buildSignal(
    candles,
    indicators,
    sr,
    structure,
    pattern
) {

    if (
        candles.length < 50
    ) {

        return {

            direction: "WAIT",

            confidence: 0,

            reason:
                "Collecting sufficient market data."

        };

    }


    const price =
        candles[candles.length - 1].close;


    let longScore = 0;

    let shortScore = 0;


    const reasonsLong = [];

    const reasonsShort = [];


    /* EMA TREND */

    if (
        indicators.ema20 !== null &&
        indicators.ema50 !== null
    ) {

        if (
            price >
            indicators.ema20 &&
            indicators.ema20 >
            indicators.ema50
        ) {

            longScore += 18;

            reasonsLong.push(
                "EMA trend aligned bullish"
            );

        }


        if (
            price <
            indicators.ema20 &&
            indicators.ema20 <
            indicators.ema50
        ) {

            shortScore += 18;

            reasonsShort.push(
                "EMA trend aligned bearish"
            );

        }

    }


    /* EMA 200 */

    if (
        indicators.ema200 !== null
    ) {

        if (
            price >
            indicators.ema200
        ) {

            longScore += 10;

        }

        else if (
            price <
            indicators.ema200
        ) {

            shortScore += 10;

        }

    }


    /* RSI */

    if (
        indicators.rsi !== null
    ) {

        if (
            indicators.rsi >= 52 &&
            indicators.rsi <= 68
        ) {

            longScore += 12;

            reasonsLong.push(
                "Bullish RSI momentum"
            );

        }


        if (
            indicators.rsi <= 48 &&
            indicators.rsi >= 32
        ) {

            shortScore += 12;

            reasonsShort.push(
                "Bearish RSI momentum"
            );

        }


        /* Avoid chasing extreme RSI */

        if (
            indicators.rsi > 75
        ) {

  

           
               
           
