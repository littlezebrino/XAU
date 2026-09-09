/* =========================================================
   QAYYUM OFFICIALZ GOLD TERMINAL
   XAUUSD / XAUUSDT FOREX SIGNAL SYSTEM

   JAVASCRIPT — PART 1

   FOUNDATION
   LIVE GOLD PRICE
   MARKET CONNECTION
   BASIC STATE
   GOLD PIP SYSTEM
========================================================= */


/* =========================================================
   1. MAIN CONFIGURATION
========================================================= */

const CONFIG = {

    symbol: "XAUUSDT",

    displaySymbol: "XAUUSD",

    timeframe: "15m",

    candleLimit: 500,

    websocketURL:
        "wss://stream.binance.com:9443/ws/xauusdt@ticker",

    apiURL:
        "https://api.binance.com/api/v3",

    reconnectDelay: 3000

};


/* =========================================================
   2. GOLD PIP SYSTEM
=========================================================

   IMPORTANT:

   For this project:

   $1.00 MOVE = 10 PIPS

   Therefore:

   $0.10 MOVE = 1 PIP

   Examples:

   10 pips  = $1.00 move
   20 pips  = $2.00 move
   50 pips  = $5.00 move
   100 pips = $10.00 move

========================================================= */

const GOLD_PIP_SIZE = 0.10;


/* Convert price movement to pips */

function priceToPips(priceMove) {

    return Number(priceMove) / GOLD_PIP_SIZE;

}


/* Convert pips to price movement */

function pipsToPrice(pips) {

    return Number(pips) * GOLD_PIP_SIZE;

}


/* =========================================================
   3. APPLICATION STATE
========================================================= */

const market = {

    price: null,

    previousPrice: null,

    change: 0,

    changePercent: 0,

    connected: false,

    websocket: null,

    reconnectTimer: null,

    candles: [],

    lastUpdate: null

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

    analysis: "Waiting for market analysis..."

};


/* =========================================================
   5. TRADE HISTORY
========================================================= */

let tradeHistory = JSON.parse(

    localStorage.getItem(
        "qayyum_gold_trade_history"
    )

) || [];


/* =========================================================
   6. PERFORMANCE DATA
========================================================= */

let performance = JSON.parse(

    localStorage.getItem(
        "qayyum_gold_performance"
    )

) || {

    totalSignals: 0,

    wins: 0,

    losses: 0

};


/* =========================================================
   7. DOM HELPER
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   8. SAFE TEXT UPDATE
========================================================= */

function setText(id, value) {

    const element =
        getElement(id);

    if (!element) {

        return;

    }

    element.textContent = value;

}


/* =========================================================
   9. PRICE FORMAT
========================================================= */

function formatPrice(price) {

    if (
        price === null ||
        price === undefined ||
        isNaN(price)
    ) {

        return "--";

    }

    return Number(price).toLocaleString(
        "en-US",
        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    );

}


/* =========================================================
   10. UPDATE LIVE PRICE ON WEBSITE
========================================================= */

function updateLivePrice(price) {

    price = Number(price);

    if (!Number.isFinite(price)) {

        return;

    }


    market.previousPrice =
        market.price;

    market.price =
        price;

    market.lastUpdate =
        new Date();


    /* Main live price */

    setText(
        "gold-price",
        "$" + formatPrice(price)
    );


    /* Alternative IDs */

    setText(
        "xau-price",
        "$" + formatPrice(price)
    );

    setText(
        "live-price",
        "$" + formatPrice(price)
    );


    /* Price movement */

    if (
        market.previousPrice !== null
    ) {

        market.change =
            market.price -
            market.previousPrice;


        if (
            market.previousPrice !== 0
        ) {

            market.changePercent =

                (
                    market.change /
                    market.previousPrice
                ) * 100;

        }

    }


    updatePriceChange();

}


/* =========================================================
   11. PRICE CHANGE DISPLAY
========================================================= */

function updatePriceChange() {

    const change =
        market.change;


    const percent =
        market.changePercent;


    const element =
        getElement("price-change");


    if (!element) {

        return;

    }


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
        "positive",
        "negative",
        "neutral"
    );


    if (change > 0) {

        element.classList.add(
            "positive"
        );

    }

    else if (change < 0) {

        element.classList.add(
            "negative"
        );

    }

    else {

        element.classList.add(
            "neutral"
        );

    }

}


/* =========================================================
   12. CONNECTION STATUS
========================================================= */

function updateConnectionStatus(
    connected
) {

    market.connected =
        connected;


    const element =
        getElement(
            "connection-status"
        );


    if (!element) {

        return;

    }


    if (connected) {

        element.textContent =
            "LIVE";

        element.classList.remove(
            "offline"
        );

        element.classList.add(
            "online"
        );

    }

    else {

        element.textContent =
            "OFFLINE";

        element.classList.remove(
            "online"
        );

        element.classList.add(
            "offline"
        );

    }

}


/* =========================================================
   13. BINANCE GOLD WEBSOCKET
========================================================= */

function startGoldWebSocket() {


    console.log(
        "Connecting to XAUUSDT live feed..."
    );


    updateConnectionStatus(
        false
    );


    try {

        const socket =
            new WebSocket(
                CONFIG.websocketURL
            );


        market.websocket =
            socket;


        /* -------------------------
           CONNECTED
        ------------------------- */

        socket.onopen = function() {

            console.log(
                "XAUUSDT WebSocket connected."
            );


            updateConnectionStatus(
                true
            );

        };


        /* -------------------------
           LIVE MESSAGE
        ------------------------- */

        socket.onmessage =
            function(event) {

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );


                    const price =
                        Number(data.c);


                    if (
                        Number.isFinite(price)
                    ) {

                        updateLivePrice(
                            price
                        );

                    }

                }

                catch(error) {

                    console.error(
                        "Price data error:",
                        error
                    );

                }

            };


        /* -------------------------
           ERROR
        ------------------------- */

        socket.onerror =
            function(error) {

                console.warn(
                    "WebSocket error:",
                    error
                );


                updateConnectionStatus(
                    false
                );

            };


        /* -------------------------
           CLOSED
        ------------------------- */

        socket.onclose =
            function() {

                console.warn(
                    "WebSocket disconnected."
                );


                updateConnectionStatus(
                    false
                );


                reconnectGoldSocket();

            };

    }

    catch(error) {

        console.error(
            "WebSocket startup error:",
            error
        );


        reconnectGoldSocket();

    }

}


/* =========================================================
   14. WEBSOCKET RECONNECT
========================================================= */

function reconnectGoldSocket() {


    if (
        market.reconnectTimer
    ) {

        clearTimeout(
            market.reconnectTimer
        );

    }


    market.reconnectTimer =

        setTimeout(
            function() {

                startGoldWebSocket();

            },

            CONFIG.reconnectDelay
        );

}


/* =========================================================
   15. REST FALLBACK PRICE
=========================================================

   WebSocket connect hone se pehle ek price
   REST API se lene ki koshish hogi.

========================================================= */

async function getInitialGoldPrice() {

    try {

        const response =

            await fetch(

                CONFIG.apiURL +
                "/ticker/price?symbol=" +
                CONFIG.symbol

            );


        if (!response.ok) {

            throw new Error(
                "Price request failed"
            );

        }


        const data =
            await response.json();


        const price =
            Number(data.price);


        if (
            Number.isFinite(price)
        ) {

            updateLivePrice(
                price
            );

        }

    }

    catch(error) {

        console.warn(
            "Initial gold price unavailable:",
            error
        );

    }

}


/* =========================================================
   16. PIP DISPLAY HELPER
========================================================= */

function formatPips(pips) {

    if (
        pips === null ||
        pips === undefined ||
        isNaN(pips)
    ) {

        return "--";

    }


    return (
        Number(pips).toFixed(0) +
        " PIPS"
    );

}


/* =========================================================
   17. CALCULATE SL FROM PIPS
========================================================= */

function calculateStopLoss(
    entry,
    direction,
    pips
) {

    const movement =
        pipsToPrice(pips);


    if (
        direction === "LONG"
    ) {

        return entry - movement;

    }


    if (
        direction === "SHORT"
    ) {

        return entry + movement;

    }


    return null;

}


/* =========================================================
   18. CALCULATE TAKE PROFIT FROM PIPS
========================================================= */

function calculateTakeProfit(
    entry,
    direction,
    pips
) {

    const movement =
        pipsToPrice(pips);


    if (
        direction === "LONG"
    ) {

        return entry + movement;

    }


    if (
        direction === "SHORT"
    ) {

        return entry - movement;

    }


    return null;

}


/* =========================================================
   19. LOT PROFIT CALCULATOR
=========================================================

   Gold standard contract assumption:

   1 LOT = 100 OZ

   Profit:

   price movement × contract size × lot size

   Example:

   Gold moves $1

   1.00 lot:
   $1 × 100 × 1
   = $100

   0.01 lot:
   $1 × 100 × 0.01
   = $1

   So:

   $1 MOVE
   0.01 LOT
   = approximately $1

   This is the basic calculation model.

========================================================= */

const GOLD_CONTRACT_SIZE =
    100;


function calculateLotProfit(
    entry,
    exit,
    lotSize
) {

    const priceMove =
        Math.abs(
            Number(exit) -
            Number(entry)
        );


    const lots =
        Number(lotSize);


    if (
        !Number.isFinite(priceMove) ||
        !Number.isFinite(lots)
    ) {

        return 0;

    }


    return (
        priceMove *
        GOLD_CONTRACT_SIZE *
        lots
    );

}


/* =========================================================
   20. SAVE TRADE HISTORY
========================================================= */

function saveTradeHistory() {

    localStorage.setItem(

        "qayyum_gold_trade_history",

        JSON.stringify(
            tradeHistory
        )

    );

}


/* =========================================================
   21. SAVE PERFORMANCE
========================================================= */

function savePerformance() {

    localStorage.setItem(

        "qayyum_gold_performance",

        JSON.stringify(
            performance
        )

    );

}


/* =========================================================
   22. MARKET CLOCK
========================================================= */

function updateClock() {

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
   23. INITIALIZE
========================================================= */

async function initializeGoldTerminal() {

    console.log(
        "Qayyum OfficialZ Gold Terminal"
    );


    await getInitialGoldPrice();


    startGoldWebSocket();


    updateClock();

}


/* =========================================================
   24. CLOCK
========================================================= */

setInterval(
    updateClock,
    1000
);


/* =========================================================
   25. START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeGoldTerminal();

    }
);


/* =========================================================
   END OF JAVASCRIPT PART 1
========================================================= */






/* =========================================================
   QAYYUM OFFICIALZ GOLD TERMINAL
   JAVASCRIPT — PART 2

   MARKET DATA + ADVANCED INDICATOR ENGINE

   Indicators included:

   1. EMA 9



/* =========================================================
   XAUUSD PREMIUM SIGNAL ENGINE
   JS PART 3
   ========================================================= */

/*
   IMPORTANT XAUUSD RULE

   $1.00 price movement = 10 pips

   Example:
   Entry 3340.00
   TP    3344.00

   Price move = $4.00
   Pips       = 40 pips

   For 0.01 lot:
   $1 move = approximately $1 profit
   Therefore:
   40 pips ($4 move) = approximately $4 profit

   This project uses XAUUSD / GOLD logic.
*/


// =========================================================
// XAUUSD MARKET CONFIGURATION
// =========================================================

const GOLD_CONFIG = {

    symbol: "XAUUSDT",

    displayName: "XAUUSD",

    pipSize: 0.10,

    dollarsPerOneDollarMoveAt001Lot: 1,

    minLot: 0.01,

    maxLot: 100,

    defaultRiskPips: 35,

    defaultRewardPips: 60,

    signalTimeframe: "15m",

    analysisTimeframe: "5m",

    higherTimeframe: "1h"

};



// =========================================================
// PRICE -> PIPS
// =========================================================

function priceMoveToPips(priceMove) {

    return Math.abs(priceMove) / GOLD_CONFIG.pipSize;

}



// =========================================================
// PIPS -> PRICE MOVE
// =========================================================

function pipsToPriceMove(pips) {

    return pips * GOLD_CONFIG.pipSize;

}



// =========================================================
// PIPS -> PROFIT
// =========================================================

function calculateGoldProfit(pips, lotSize) {

    pips = Number(pips);
    lotSize = Number(lotSize);

    if (
        !Number.isFinite(pips) ||
        !Number.isFinite(lotSize) ||
        pips <= 0 ||
        lotSize <= 0
    ) {

        return 0;

    }


    /*
       0.01 lot:

       10 pips = $1

       Therefore:

       profit = pips × lot size × $10

       Example:

       40 pips × 0.01 × 10
       = $4
    */

    return pips * lotSize * 10;

}



// =========================================================
// PIPS -> LOSS
// =========================================================

function calculateGoldLoss(pips, lotSize) {

    return calculateGoldProfit(pips, lotSize);

}



// =========================================================
// ENTRY + PIPS -> LONG TP
// =========================================================

function calculateLongTarget(entry, pips) {

    entry = Number(entry);
    pips = Number(pips);

    return entry + pipsToPriceMove(pips);

}



// =========================================================
// ENTRY + PIPS -> LONG SL
// =========================================================

function calculateLongStop(entry, pips) {

    entry = Number(entry);
    pips = Number(pips);

    return entry - pipsToPriceMove(pips);

}



// =========================================================
// ENTRY + PIPS -> SHORT TP
// =========================================================

function calculateShortTarget(entry, pips) {

    entry = Number(entry);
    pips = Number(pips);

    return entry - pipsToPriceMove(pips);

}



// =========================================================
// ENTRY + PIPS -> SHORT SL
// =========================================================

function calculateShortStop(entry, pips) {

    entry = Number(entry);
    pips = Number(pips);

    return entry + pipsToPriceMove(pips);

}



// =========================================================
// GOLD PRICE FORMATTER
// =========================================================

function formatGoldPrice(price) {

    price = Number(price);

    if (!Number.isFinite(price)) {

        return "--";

    }

    return price.toFixed(2);

}



// =========================================================
// PIP FORMATTER
// =========================================================

function formatPips(pips) {

    pips = Number(pips);

    if (!Number.isFinite(pips)) {

        return "--";

    }

    return Math.round(pips) + " pips";

}



// =========================================================
// MONEY FORMATTER
// =========================================================

function formatMoney(value) {

    value = Number(value);

    if (!Number.isFinite(value)) {

        return "--";

    }

    return "$" + value.toFixed(2);

}



// =========================================================
// LOT SIZE SANITIZER
// =========================================================

function sanitizeLotSize(lot) {

    lot = Number(lot);

    if (!Number.isFinite(lot)) {

        return GOLD_CONFIG.minLot;

    }


    if (lot < GOLD_CONFIG.minLot) {

        lot = GOLD_CONFIG.minLot;

    }


    if (lot > GOLD_CONFIG.maxLot) {

        lot = GOLD_CONFIG.maxLot;

    }


    return Math.round(lot * 100) / 100;

}



// =========================================================
// GOLD TRADE CALCULATOR
// =========================================================

function calculateGoldTrade(entry, exit, lotSize, direction) {

    entry = Number(entry);
    exit = Number(exit);

    lotSize = sanitizeLotSize(lotSize);


    if (
        !Number.isFinite(entry) ||
        !Number.isFinite(exit)
    ) {

        return {

            valid: false,

            pips: 0,

            profit: 0,

            priceMove: 0

        };

    }


    let priceMove;


    if (direction === "LONG") {

        priceMove = exit - entry;

    }

    else {

        priceMove = entry - exit;

    }


    const pips = priceMoveToPips(priceMove);


    const profit = calculateGoldProfit(
        pips,
        lotSize
    );


    return {

        valid: true,

        pips: pips,

        profit: profit,

        priceMove: priceMove,

        lotSize: lotSize,

        direction: direction

    };

}



// =========================================================
// RISK / REWARD CALCULATOR
// =========================================================

function calculateRiskReward(
    entry,
    stopLoss,
    takeProfit,
    direction
) {

    entry = Number(entry);
    stopLoss = Number(stopLoss);
    takeProfit = Number(takeProfit);


    if (
        !Number.isFinite(entry) ||
        !Number.isFinite(stopLoss) ||
        !Number.isFinite(takeProfit)
    ) {

        return 0;

    }


    let risk;
    let reward;


    if (direction === "LONG") {

        risk = Math.abs(entry - stopLoss);

        reward = Math.abs(takeProfit - entry);

    }

    else {

        risk = Math.abs(stopLoss - entry);

        reward = Math.abs(entry - takeProfit);

    }


    if (risk <= 0) {

        return 0;

    }


    return reward / risk;

}



// =========================================================
// ATR BASED STOP / TARGET
// =========================================================

function buildGoldLevels(
    price,
    atr,
    direction
) {

    price = Number(price);
    atr = Number(atr);


    if (
        !Number.isFinite(price) ||
        !Number.isFinite(atr) ||
        atr <= 0
    ) {

        return null;

    }


    /*
       We don't use an unnecessarily huge SL.

       The signal engine is designed for shorter
       intraday GOLD moves.

       ATR determines market volatility.

       SL = roughly 0.75 ATR
       TP1 = roughly 1.15 ATR
       TP2 = roughly 1.70 ATR
       TP3 = roughly 2.25 ATR
    */


    const slDistance = atr * 0.75;

    const tp1Distance = atr * 1.15;

    const tp2Distance = atr * 1.70;

    const tp3Distance = atr * 2.25;


    let sl;
    let tp1;
    let tp2;
    let tp3;


    if (direction === "LONG") {

        sl = price - slDistance;

        tp1 = price + tp1Distance;

        tp2 = price + tp2Distance;

        tp3 = price + tp3Distance;

    }

    else {

        sl = price + slDistance;

        tp1 = price - tp1Distance;

        tp2 = price - tp2Distance;

        tp3 = price - tp3Distance;

    }


    return {

        entry: price,

        sl: sl,

        tp1: tp1,

        tp2: tp2,

        tp3: tp3,

        slPips: priceMoveToPips(slDistance),

        tp1Pips: priceMoveToPips(tp1Distance),

        tp2Pips: priceMoveToPips(tp2Distance),

        tp3Pips: priceMoveToPips(tp3Distance)

    };

}



// =========================================================
// SIGNAL QUALITY FILTER
// =========================================================

function signalQualityScore(data) {

    let score = 0;


    if (!data) {

        return 0;

    }


    // Trend
    if (data.trendStrong) {

        score += 15;

    }


    // EMA alignment
    if (data.emaAligned) {

        score += 15;

    }


    // RSI confirmation
    if (data.rsiConfirmed) {

        score += 10;

    }


    // MACD confirmation
    if (data.macdConfirmed) {

        score += 10;

    }


    // VWAP confirmation
    if (data.vwapConfirmed) {

        score += 10;

    }


    // Volume
    if (data.volumeConfirmed) {

        score += 10;

    }


    // Momentum
    if (data.momentumConfirmed) {

        score += 10;

    }


    // Higher timeframe
    if (data.htfConfirmed) {

        score += 10;

    }


    // Market structure
    if (data.structureConfirmed) {

        score += 10;

    }


    return Math.min(100, score);

}



// =========================================================
// SIGNAL DECISION
// =========================================================

function decideGoldSignal(data) {

    if (!data) {

        return {

            signal: "WAIT",

            bias: "NEUTRAL",

            score: 0

        };

    }


    const score = signalQualityScore(data);


    let bullish = 0;

    let bearish = 0;


    if (data.priceAboveEMA) {

        bullish++;

    }

    else {

        bearish++;

    }


    if (data.rsiBullish) {

        bullish++;

    }

    else if (data.rsiBearish) {

        bearish++;

    }


    if (data.macdBullish) {

        bullish++;

    }

    else if (data.macdBearish) {

        bearish++;

    }


    if (data.priceAboveVWAP) {

        bullish++;

    }

    else {

        bearish++;

    }


    if (data.htfBullish) {

        bullish++;

    }

    else if (data.htfBearish) {

        bearish++;

    }


    /*
       QUALITY OVER QUANTITY

       We intentionally require strong agreement.

       This means the engine can remain WAIT
       for a long time instead of forcing trades.
    */


    if (
        bullish >= 4 &&
        bullish > bearish &&
        score >= 70
    ) {

        return {

            signal: "LONG",

            bias: "BULLISH",

            score: score

        };

    }


    if (
        bearish >= 4 &&
        bearish > bullish &&
        score >= 70
    ) {

        return {

            signal: "SHORT",

            bias: "BEARISH",

            score: score

        };

    }


    return {

        signal: "WAIT",

        bias:
            bullish > bearish
                ? "BULLISH WATCH"
                : bearish > bullish
                    ? "BEARISH WATCH"
                    : "NEUTRAL",

        score: score

    };

}



// =========================================================
// BUILD SIGNAL OBJECT
// =========================================================

function createGoldSignal(data) {

    const decision = decideGoldSignal(data);


    if (
        decision.signal === "WAIT" ||
        !data.price
    ) {

        return {

            signal: "WAIT",

            bias: decision.bias,

            confidence: decision.score,

            entry: null,

            sl: null,

            tp1: null,

            tp2: null,

            tp3: null,

            slPips: null,

            tp1Pips: null,

            tp2Pips: null,

            tp3Pips: null

        };

    }


    const levels = buildGoldLevels(
        data.price,
        data.atr,
        decision.signal
    );


    if (!levels) {

        return {

            signal: "WAIT",

            bias: "NEUTRAL",

            confidence: 0

        };

    }


    return {

        signal: decision.signal,

        bias: decision.bias,

        confidence: decision.score,

        entry: levels.entry,

        sl: levels.sl,

        tp1: levels.tp1,

        tp2: levels.tp2,

        tp3: levels.tp3,

        slPips: levels.slPips,

        tp1Pips: levels.tp1Pips,

        tp2Pips: levels.tp2Pips,

        tp3Pips: levels.tp3Pips

    };

}



// =========================================================
// GOLD SIGNAL SUMMARY
// =========================================================

function getGoldSignalSummary(signal) {

    if (!signal) {

        return "Waiting for market data...";

    }


    if (signal.signal === "WAIT") {

        return `WAIT | ${signal.bias} | Quality ${signal.confidence}%`;

    }


    return (

        `${signal.signal} | ` +

        `${signal.bias} | ` +

        `Quality ${signal.confidence}% | ` +

        `SL ${Math.round(signal.slPips)} pips | ` +

        `TP1 ${Math.round(signal.tp1Pips)} pips`

    );

}



// =========================================================
// TEST / DEBUG
// =========================================================

console.log(
    "XAUUSD Premium Engine Loaded"
);


console.log(
    "Gold Pip Rule: $1.00 = 10 pips"
);


console.log(
    "Example 40 pips @ 0.01 lot =",
    formatMoney(
        calculateGoldProfit(40, 0.01)
    )
);




/* =========================================================
   XAUUSD PREMIUM LIVE MARKET ANALYSIS
   JS PART 4
   ========================================================= */

/*
   PART 4 RESPONSIBILITIES

   - Live XAUUSDT price
   - Binance WebSocket
   - 15m candle data
   - 5m candle data
   - 1h candle data
   - EMA
   - RSI
   - MACD
   - ATR
   - VWAP
   - Volume
   - Momentum
   - Market structure
   - Higher timeframe confirmation
   - Premium signal preparation

   NOTE:
   XAUUSDT is used as the live crypto-exchange
   gold proxy. For actual Exness XAUUSD execution,
   broker-side pricing can differ slightly.
*/


// =========================================================
// MARKET DATA STORAGE
// =========================================================

const goldMarket = {

    price: null,

    previousPrice: null,

    candles5m: [],

    candles15m: [],

    candles1h: [],

    lastUpdate: null,

    connected: false,

    signal: null,

    analysis: null

};



// =========================================================
// BINANCE API
// =========================================================

const BINANCE_API =
    "https://api.binance.com/api/v3";



const GOLD_SYMBOL =
    "XAUUSDT";



// =========================================================
// FETCH CANDLES
// =========================================================

async function fetchGoldCandles(
    interval,
    limit = 500
) {

    try {

        const response = await fetch(

            `${BINANCE_API}/klines` +
            `?symbol=${GOLD_SYMBOL}` +
            `&interval=${interval}` +
            `&limit=${limit}`

        );


        if (!response.ok) {

            throw new Error(
                "Binance candle request failed"
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid candle response"
            );

        }


        return data;

    }

    catch (error) {

        console.error(
            "Candle fetch error:",
            error
        );


        return [];

    }

}



// =========================================================
// INITIAL MARKET DATA
// =========================================================

async function loadGoldMarketData() {

    try {

        const [
            candles5m,
            candles15m,
            candles1h
        ] = await Promise.all([

            fetchGoldCandles(
                GOLD_CONFIG.analysisTimeframe,
                300
            ),

            fetchGoldCandles(
                GOLD_CONFIG.signalTimeframe,
                500
            ),

            fetchGoldCandles(
                GOLD_CONFIG.higherTimeframe,
                300
            )

        ]);


        goldMarket.candles5m =
            candles5m;

        goldMarket.candles15m =
            candles15m;

        goldMarket.candles1h =
            candles1h;


        if (candles15m.length) {

            const last =
                candles15m[
                    candles15m.length - 1
                ];

            goldMarket.price =
                Number(last[4]);

        }


        goldMarket.lastUpdate =
            new Date();


        console.log(
            "Gold market data loaded"
        );


        analyzeGoldMarket();

    }

    catch (error) {

        console.error(
            "Gold market loading error:",
            error
        );

    }

}



// =========================================================
// CONVERT CANDLES TO CLOSE PRICES
// =========================================================

function candleCloses(candles) {

    return candles.map(
        candle => Number(candle[4])
    );

}



// =========================================================
// CANDLE HIGHS
// =========================================================

function candleHighs(candles) {

    return candles.map(
        candle => Number(candle[2])
    );

}



// =========================================================
// CANDLE LOWS
// =========================================================

function candleLows(candles) {

    return candles.map(
        candle => Number(candle[3])
    );

}



// =========================================================
// MOMENTUM
// =========================================================

function calculateMomentum(prices, period = 10) {

    if (
        !prices ||
        prices.length <= period
    ) {

        return 0;

    }


    const current =
        prices[prices.length - 1];


    const previous =
        prices[
            prices.length - 1 - period
        ];


    if (!previous) {

        return 0;

    }


    return (
        (current - previous) /
        previous
    ) * 100;

}



// =========================================================
// MOMENTUM STATUS
// =========================================================

function momentumStatus(
    momentum
) {

    if (momentum >= 0.35) {

        return "BULLISH";

    }


    if (momentum <= -0.35) {

        return "BEARISH";

    }


    return "NEUTRAL";

}



// =========================================================
// EMA ALIGNMENT
// =========================================================

function getEMAAlignment(prices) {

    if (prices.length < 200) {

        return {

            bullish: false,

            bearish: false

        };

    }


    const ema20 =
        EMA(prices, 20);

    const ema50 =
        EMA(prices, 50);

    const ema200 =
        EMA(prices, 200);


    return {

        bullish:
            ema20 > ema50 &&
            ema50 > ema200,

        bearish:
            ema20 < ema50 &&
            ema50 < ema200,

        ema20,
        ema50,
        ema200

    };

}



// =========================================================
// RSI DIRECTION
// =========================================================

function getRSIStatus(rsi) {

    if (
        rsi >= 52 &&
        rsi <= 68
    ) {

        return "BULLISH";

    }


    if (
        rsi <= 48 &&
        rsi >= 32
    ) {

        return "BEARISH";

    }


    return "NEUTRAL";

}



// =========================================================
// MACD STATUS
// =========================================================

function getMACDStatus(
    macd,
    prices
) {

    const recentPrices =
        prices.slice(-100);


    if (
        recentPrices.length < 26
    ) {

        return "NEUTRAL";

    }


    const previousPrices =
        prices.slice(
            -101,
            -1
        );


    const previousMACD =
        MACD(previousPrices);


    if (
        macd > 0 &&
        macd > previousMACD
    ) {

        return "BULLISH";

    }


    if (
        macd < 0 &&
        macd < previousMACD
    ) {

        return "BEARISH";

    }


    return "NEUTRAL";

}



// =========================================================
// VWAP STATUS
// =========================================================

function getVWAPStatus(
    price,
    vwap
) {

    if (price > vwap) {

        return "ABOVE";

    }


    if (price < vwap) {

        return "BELOW";

    }


    return "AT";

}



// =========================================================
// VOLUME STATUS
// =========================================================

function getVolumeStatus(
    candles
) {

    if (
        !candles ||
        candles.length < 30
    ) {

        return "NORMAL";

    }


    const volumes =
        candles.map(
            c => Number(c[5])
        );


    const current =
        volumes[
            volumes.length - 1
        ];


    const previous =
        volumes.slice(-21, -1);


    const average =
        previous.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / previous.length;


    if (
        current >
        average * 1.5
    ) {

        return "VERY HIGH";

    }


    if (
        current >
        average * 1.2
    ) {

        return "HIGH";

    }


    if (
        current <
        average * 0.7
    ) {

        return "LOW";

    }


    return "NORMAL";

}



// =========================================================
// MARKET STRUCTURE
// =========================================================

function detectMarketStructure(
    candles
) {

    if (
        !candles ||
        candles.length < 30
    ) {

        return {

            status: "UNKNOWN",

            bullish: false,

            bearish: false

        };

    }


    const recent =
        candles.slice(-30);


    const highs =
        candleHighs(recent);


    const lows =
        candleLows(recent);


    const half =
        Math.floor(
            recent.length / 2
        );


    const firstHalfHigh =
        Math.max(
            ...highs.slice(
                0,
                half
            )
        );


    const secondHalfHigh =
        Math.max(
            ...highs.slice(
                half
            )
        );


    const firstHalfLow =
        Math.min(
            ...lows.slice(
                0,
                half
            )
        );


    const secondHalfLow =
        Math.min(
            ...lows.slice(
                half
            )
        );


    const bullish =
        secondHalfHigh >
            firstHalfHigh &&
        secondHalfLow >
            firstHalfLow;


    const bearish =
        secondHalfHigh <
            firstHalfHigh &&
        secondHalfLow <
            firstHalfLow;


    if (bullish) {

        return {

            status: "BULLISH STRUCTURE",

            bullish: true,

            bearish: false

        };

    }


    if (bearish) {

        return {

            status: "BEARISH STRUCTURE",

            bullish: false,

            bearish: true

        };

    }


    return {

        status: "RANGING",

        bullish: false,

        bearish: false

    };

}



// =========================================================
// SUPPORT / RESISTANCE
// =========================================================

function findSupportResistance(
    candles
) {

    if (
        !candles ||
        candles.length < 50
    ) {

        return {

            support: null,

            resistance: null

        };

    }


    const recent =
        candles.slice(-100);


    const highs =
        candleHighs(recent);


    const lows =
        candleLows(recent);


    const resistance =
        Math.max(...highs);


    const support =
        Math.min(...lows);


    return {

        support,

        resistance

    };

}



// =========================================================
// NEAR SUPPORT / RESISTANCE
// =========================================================

function checkSRLocation(
    price,
    support,
    resistance,
    atr
) {

    if (
        !support ||
        !resistance ||
        !atr
    ) {

        return "MID-RANGE";

    }


    const supportDistance =
        Math.abs(
            price - support
        );


    const resistanceDistance =
        Math.abs(
            resistance - price
        );


    if (
        supportDistance <=
        atr * 0.5
    ) {

        return "NEAR SUPPORT";

    }


    if (
        resistanceDistance <=
        atr * 0.5
    ) {

        return "NEAR RESISTANCE";

    }


    return "MID-RANGE";

}



// =========================================================
// CANDLE PATTERN
// =========================================================

function detectCandlePattern(
    candles
) {

    if (
        !candles ||
        candles.length < 3
    ) {

        return "NONE";

    }


    const current =
        candles[
            candles.length - 1
        ];


    const previous =
        candles[
            candles.length - 2
        ];


    const open =
        Number(current[1]);


    const high =
        Number(current[2]);


    const low =
        Number(current[3]);


    const close =
        Number(current[4]);


    const prevOpen =
        Number(previous[1]);


    const prevClose =
        Number(previous[4]);


    const body =
        Math.abs(
            close - open
        );


    const upperWick =
        high -
        Math.max(
            open,
            close
        );


    const lowerWick =
        Math.min(
            open,
            close
        ) - low;


    // Bullish engulfing
    if (
        close > open &&
        prevClose < prevOpen &&
        close >= prevOpen &&
        open <= prevClose
    ) {

        return "BULLISH ENGULFING";

    }


    // Bearish engulfing
    if (
        close < open &&
        prevClose > prevOpen &&
        close <= prevOpen &&
        open >= prevClose
    ) {

        return "BEARISH ENGULFING";

    }


    // Bullish rejection
    if (
        lowerWick >
        body * 2 &&
        close > open
    ) {

        return "BULLISH REJECTION";

    }


    // Bearish rejection
    if (
        upperWick >
        body * 2 &&
        close < open
    ) {

        return "BEARISH REJECTION";

    }


    return "NORMAL";

}



// =========================================================
// HIGHER TIMEFRAME ANALYSIS
// =========================================================

function analyzeHigherTimeframe(
    candles
) {

    if (
        !candles ||
        candles.length < 200
    ) {

        return {

            bullish: false,

            bearish: false,

            bias: "UNKNOWN"

        };

    }


    const prices =
        candleCloses(candles);


    const price =
        prices[
            prices.length - 1
        ];


    const ema50 =
        EMA(prices, 50);


    const ema200 =
        EMA(prices, 200);


    const rsi =
        RSI(prices);


    if (
        price > ema50 &&
        ema50 > ema200 &&
        rsi > 50
    ) {

        return {

            bullish: true,

            bearish: false,

            bias: "BULLISH"

        };

    }


    if (
        price < ema50 &&
        ema50 < ema200 &&
        rsi < 50
    ) {

        return {

            bullish: false,

            bearish: true,

            bias: "BEARISH"

        };

    }


    return {

        bullish: false,

        bearish: false,

        bias: "NEUTRAL"

    };

}



// =========================================================
// PREMIUM MARKET ANALYSIS
// =========================================================

function analyzeGoldMarket() {

    const candles =
        goldMarket.candles15m;


    if (
        !candles ||
        candles.length < 200
    ) {

        console.log(
            "Waiting for enough XAUUSDT data..."
        );

        return null;

    }


    const prices =
        candleCloses(candles);


    const price =
        prices[
            prices.length - 1
        ];


    goldMarket.previousPrice =
        goldMarket.price;


    goldMarket.price =
        price;



    // -----------------------------------------------------
    // INDICATORS
    // -----------------------------------------------------

    const ema20 =
        EMA(prices, 20);


    const ema50 =
        EMA(prices, 50);


    const ema200 =
        EMA(prices, 200);


    const rsi =
        RSI(prices, 14);


    const macd =
        MACD(prices);


    const atr =
        ATR(candles);


    const vwap =
        VWAP(candles);


    const volume =
        getVolumeStatus(candles);


    const momentum =
        calculateMomentum(
            prices,
            10
        );


    const momentumState =
        momentumStatus(momentum);


    const emaAlignment =
        getEMAAlignment(prices);


    const rsiState =
        getRSIStatus(rsi);


    const macdState =
        getMACDStatus(
            macd,
            prices
        );


    const vwapState =
        getVWAPStatus(
            price,
            vwap
        );


    const structure =
        detectMarketStructure(
            candles
        );


    const sr =
        findSupportResistance(
            candles
        );


    const srLocation =
        checkSRLocation(
            price,
            sr.support,
            sr.resistance,
            atr
        );


    const pattern =
        detectCandlePattern(
            candles
        );


    const higherTF =
        analyzeHigherTimeframe(
            goldMarket.candles1h
        );



    // -----------------------------------------------------
    // TREND STRENGTH
    // -----------------------------------------------------

    const trend =
        trendStrength(prices);


    const trendStrong =
        trend === "STRONG";



    // -----------------------------------------------------
    // BULLISH / BEARISH CONDITIONS
    // -----------------------------------------------------

    const priceAboveEMA =
        price > ema20 &&
        ema20 > ema50;


    const priceBelowEMA =
        price < ema20 &&
        ema20 < ema50;


    const rsiBullish =
        rsiState === "BULLISH";


    const rsiBearish =
        rsiState === "BEARISH";


    const macdBullish =
        macdState === "BULLISH";


    const macdBearish =
        macdState === "BEARISH";


    const priceAboveVWAP =
        price > vwap;


    const priceBelowVWAP =
        price < vwap;


    const emaAlignedBullish =
        emaAlignment.bullish;


    const emaAlignedBearish =
        emaAlignment.bearish;


    const volumeConfirmed =
        volume === "HIGH" ||
        volume === "VERY HIGH";


    const momentumConfirmed =
        momentumState !== "NEUTRAL";


    const structureConfirmed =
        structure.bullish ||
        structure.bearish;


    const htfConfirmed =
        higherTF.bullish ||
        higherTF.bearish;



    // -----------------------------------------------------
    // FINAL DATA FOR SIGNAL ENGINE
    // -----------------------------------------------------

    const analysisData = {

        price,

        atr,

        ema20,

        ema50,

        ema200,

        rsi,

        macd,

        vwap,

        volume,

        momentum,

        momentumState,

        trend,

        trendStrong,

        priceAboveEMA,

        priceBelowEMA,

        rsiBullish,

        rsiBearish,

        rsiConfirmed:
            rsiBullish ||
            rsiBearish,

        macdBullish,

        macdBearish,

        macdConfirmed:
            macdBullish ||
            macdBearish,

        priceAboveVWAP,

        priceBelowVWAP,

        vwapConfirmed:
            priceAboveVWAP ||
            priceBelowVWAP,

        emaAligned:
            emaAlignedBullish ||
            emaAlignedBearish,

        volumeConfirmed,

        momentumConfirmed,

        structureConfirmed,

        htfConfirmed,

        htfBullish:
            higherTF.bullish,

        htfBearish:
            higherTF.bearish,

        structure,

        support:
            sr.support,

        resistance:
            sr.resistance,

        srLocation,

        pattern

    };



    // -----------------------------------------------------
    // SIGNAL
    // -----------------------------------------------------

    const signal =
        createGoldSignal(
            analysisData
        );


    goldMarket.signal =
        signal;


    goldMarket.analysis =
        analysisData;



    // -----------------------------------------------------
    // LOG FOR DEBUGGING
    // -----------------------------------------------------

    console.log(
        "=============================="
    );


    console.log(
        "XAUUSD MARKET ANALYSIS"
    );


    console.log(
        "Price:",
        price
    );


    console.log(
        "Signal:",
        signal.signal
    );


    console.log(
        "Bias:",
        signal.bias
    );


    console.log(
        "Quality:",
        signal.confidence + "%"
    );


    console.log(
        "RSI:",
        rsi.toFixed(2)
    );


    console.log(
        "MACD:",



/* =========================================================
   XAUUSD PREMIUM TRADING PLATFORM
   JS PART 5 — FINAL
   ========================================================= */


/* =========================================================
   XAUUSD PIP CONFIGURATION
   ========================================================= */

/*
   GOLD RULE USED BY THIS PLATFORM:

   $1.00 MOVE = 10 PIPS

   Therefore:

   $0.10 = 1 pip
   $1.00 = 10 pips
   $10.00 = 100 pips

   For 0.01 lot:

   10 pips ≈ $1

   Profit formula:

   Profit = Pips × Lot Size × $10

   Example:

   50 pips × 0.01 × $10
   = $5
*/


const XAU_PIP_SIZE = 0.10;

const XAU_PIP_VALUE_PER_LOT = 10;



/* =========================================================
   SIGNAL CONFIGURATION
   ========================================================= */

const XAU_SIGNAL_CONFIG = {

    minimumScore: 7,

    maximumConfidence: 95,

    minimumATR: 0.30,

    riskATRMultiplier: 1.20,

    reward1ATRMultiplier: 1.00,

    reward2ATRMultiplier: 1.80,

    reward3ATRMultiplier: 2.60

};



/* =========================================================
   CREATE PREMIUM SIGNAL
   ========================================================= */

function createGoldSignal(data) {

    let bullish = 0;

    let bearish = 0;


    const reasonsBullish = [];

    const reasonsBearish = [];



    /* EMA TREND */

    if (data.priceAboveEMA) {

        bullish++;

        reasonsBullish.push(
            "EMA trend bullish"
        );

    }


    if (data.priceBelowEMA) {

        bearish++;

        reasonsBearish.push(
            "EMA trend bearish"
        );

    }



    /* EMA ALIGNMENT */

    if (data.emaAligned) {

        if (
            data.emaAlignedBullish ||
            (
                data.ema20 >
                data.ema50 &&
                data.ema50 >
                data.ema200
            )
        ) {

            bullish++;

            reasonsBullish.push(
                "EMA alignment bullish"
            );

        }


        if (
            data.emaAlignedBearish ||
            (
                data.ema20 <
                data.ema50 &&
                data.ema50 <
                data.ema200
            )
        ) {

            bearish++;

            reasonsBearish.push(
                "EMA alignment bearish"
            );

        }

    }



    /* RSI */

    if (data.rsiBullish) {

        bullish++;

        reasonsBullish.push(
            "RSI momentum bullish"
        );

    }


    if (data.rsiBearish) {

        bearish++;

        reasonsBearish.push(
            "RSI momentum bearish"
        );

    }



    /* MACD */

    if (data.macdBullish) {

        bullish++;

        reasonsBullish.push(
            "MACD bullish"
        );

    }


    if (data.macdBearish) {

        bearish++;

        reasonsBearish.push(
            "MACD bearish"
        );

    }



    /* VWAP */

    if (data.priceAboveVWAP) {

        bullish++;

        reasonsBullish.push(
            "Price above VWAP"
        );

    }


    if (data.priceBelowVWAP) {

        bearish++;

        reasonsBearish.push(
            "Price below VWAP"
        );

    }



    /* MARKET STRUCTURE */

    if (
        data.structure &&
        data.structure.bullish
    ) {

        bullish += 2;

        reasonsBullish.push(
            "Bullish market structure"
        );

    }


    if (
        data.structure &&
        data.structure.bearish
    ) {

        bearish += 2;

        reasonsBearish.push(
            "Bearish market structure"
        );

    }



    /* HIGHER TIMEFRAME */

    if (data.htfBullish) {

        bullish += 2;

        reasonsBullish.push(
            "Higher timeframe bullish"
        );

    }


    if (data.htfBearish) {

        bearish += 2;

        reasonsBearish.push(
            "Higher timeframe bearish"
        );

    }



    /* MOMENTUM */

    if (
        data.momentumState ===
        "BULLISH"
    ) {

        bullish++;

        reasonsBullish.push(
            "Positive momentum"
        );

    }


    if (
        data.momentumState ===
        "BEARISH"
    ) {

        bearish++;

        reasonsBearish.push(
            "Negative momentum"
        );

    }



    /* VOLUME */

    if (data.volumeConfirmed) {

        if (
            bullish > bearish
        ) {

            bullish++;

            reasonsBullish.push(
                "Volume confirmation"
            );

        }

        else if (
            bearish > bullish
        ) {

            bearish++;

            reasonsBearish.push(
                "Volume confirmation"
            );

        }

    }



    /* CANDLE PATTERN */

    if (
        data.pattern ===
        "BULLISH ENGULFING" ||
        data.pattern ===
        "BULLISH REJECTION"
    ) {

        bullish += 2;

        reasonsBullish.push(
            data.pattern
        );

    }


    if (
        data.pattern ===
        "BEARISH ENGULFING" ||
        data.pattern ===
        "BEARISH REJECTION"
    ) {

        bearish += 2;

        reasonsBearish.push(
            data.pattern
        );

    }



    /* =====================================================
       AVOID BAD CONDITIONS
       ===================================================== */

    const marketTooWeak =
        !data.trendStrong &&
        Math.abs(data.momentum) < 0.10;


    const ATRTooSmall =
        data.atr <
        XAU_SIGNAL_CONFIG.minimumATR;



    /*
       If market is weak or volatility is too small,
       WAIT is safer than forcing a trade.
    */

    if (
        marketTooWeak ||
        ATRTooSmall
    ) {

        return {

            signal: "WAIT",

            bias: "Neutral",

            confidence: 0,

            bullishScore: bullish,

            bearishScore: bearish,

            reasonsBullish,

            reasonsBearish,

            entry: null,

            sl: null,

            tp1: null,

            tp2: null,

            tp3: null,

            slPips: 0,

            tp1Pips: 0,

            tp2Pips: 0,

            tp3Pips: 0

        };

    }



    /* =====================================================
       FINAL DECISION
       ===================================================== */

    let signal =
        "WAIT";

    let bias =
        "Neutral";

    let winningScore =
        Math.max(
            bullish,
            bearish
        );


    let confidence = 0;



    if (
        bullish >=
        XAU_SIGNAL_CONFIG.minimumScore &&
        bullish >
        bearish
    ) {

        signal =
            "LONG";

        bias =
            "Bullish";


        confidence =
            Math.min(
                XAU_SIGNAL_CONFIG.maximumConfidence,
                55 + bullish * 5
            );

    }



    else if (
        bearish >=
        XAU_SIGNAL_CONFIG.minimumScore &&
        bearish >
        bullish
    ) {

        signal =
            "SHORT";

        bias =
            "Bearish";


        confidence =
            Math.min(
                XAU_SIGNAL_CONFIG.maximumConfidence,
                55 + bearish * 5
            );

    }



    /* =====================================================
       REQUIRE STRONGER CONFIRMATION
       ===================================================== */

    if (
        signal === "LONG"
    ) {

        /*
           Avoid LONG directly under strong resistance.
        */

        if (
            data.srLocation ===
            "NEAR RESISTANCE"
        ) {

            signal =
                "WAIT";

            bias =
                "Neutral";

            confidence =
                0;

        }

    }



    if (
        signal === "SHORT"
    ) {

        /*
           Avoid SHORT directly above strong support.
        */

        if (
            data.srLocation ===
            "NEAR SUPPORT"
        ) {

            signal =
                "WAIT";

            bias =
                "Neutral";

            confidence =
                0;

        }

    }



    /* =====================================================
       ENTRY / SL / TP
       ===================================================== */

    let entry = null;

    let sl = null;

    let tp1 = null;

    let tp2 = null;

    let tp3 = null;


    let slPips = 0;

    let tp1Pips = 0;

    let tp2Pips = 0;

    let tp3Pips = 0;



    if (
        signal === "LONG"
    ) {

        entry =
            data.price;


        /*
           ATR based stop.
           This adapts to actual gold volatility.
        */

        const riskDistance =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.riskATRMultiplier,
                0.50
            );


        const reward1 =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.reward1ATRMultiplier,
                riskDistance *
                0.90
            );


        const reward2 =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.reward2ATRMultiplier,
                riskDistance *
                1.50
            );


        const reward3 =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.reward3ATRMultiplier,
                riskDistance *
                2.10
            );


        sl =
            entry -
            riskDistance;


        tp1 =
            entry +
            reward1;


        tp2 =
            entry +
            reward2;


        tp3 =
            entry +
            reward3;


        slPips =
            priceDistanceToPips(
                entry,
                sl
            );


        tp1Pips =
            priceDistanceToPips(
                entry,
                tp1
            );


        tp2Pips =
            priceDistanceToPips(
                entry,
                tp2
            );


        tp3Pips =
            priceDistanceToPips(
                entry,
                tp3
            );

    }



    else if (
        signal === "SHORT"
    ) {

        entry =
            data.price;


        const riskDistance =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.riskATRMultiplier,
                0.50
            );


        const reward1 =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.reward1ATRMultiplier,
                riskDistance *
                0.90
            );


        const reward2 =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.reward2ATRMultiplier,
                riskDistance *
                1.50
            );


        const reward3 =
            Math.max(
                data.atr *
                XAU_SIGNAL_CONFIG.reward3ATRMultiplier,
                riskDistance *
                2.10
            );


        sl =
            entry +
            riskDistance;


        tp1 =
            entry -
            reward1;


        tp2 =
            entry -
            reward2;


        tp3 =
            entry -
            reward3;


        slPips =
            priceDistanceToPips(
                entry,
                sl
            );


        tp1Pips =
            priceDistanceToPips(
                entry,
                tp1
            );


        tp2Pips =
            priceDistanceToPips(
                entry,
                tp2
            );


        tp3Pips =
            priceDistanceToPips(
                entry,
                tp3
            );

    }



    return {

        signal,

        bias,

        confidence,

        bullishScore:
            bullish,

        bearishScore:
            bearish,

        winningScore,

        reasonsBullish,

        reasonsBearish,

        entry,

        sl,

        tp1,

        tp2,

        tp3,

        slPips,

        tp1Pips,

        tp2Pips,

        tp3Pips

    };

}



/* =========================================================
   PRICE DISTANCE → PIPS
   ========================================================= */

function priceDistanceToPips(
    price1,
    price2
) {

    return Math.round(

        Math.abs(
            price1 - price2
        ) /
        XAU_PIP_SIZE

    );

}



/* =========================================================
   PIPS → PRICE DISTANCE
   ========================================================= */

function pipsToPrice(
    pips
) {

    return (
        Number(pips) *
        XAU_PIP_SIZE
    );

}



/* =========================================================
   FORMAT GOLD PRICE
   ========================================================= */

function formatGoldPrice(
    price
) {

    if (
        price === null ||
        price === undefined ||
        !Number.isFinite(
            Number(price)
        )
    ) {

        return "--";

    }


    return Number(price)
        .toFixed(2);

}



/* =========================================================
   FORMAT PIPS
   ========================================================= */

function formatPips(
    pips
) {

    if (
        pips === null ||
        pips === undefined
    ) {

        return "--";

    }


    return Math.round(
        Number(pips)
    ) + " pips";

}



/* =========================================================
   SIGNAL UI
   ========================================================= */

function renderGoldSignal() {

    const result =
        goldMarket.signal;


    if (!result) {

        return;

    }


    const signal =
        result.signal;



    /* Main signal */

    setText(
        "gold-signal",
        signal
    );


    setText(
        "xau-signal",
        signal
    );


    setText(
        "signal-direction",
        signal
    );



    /* Bias */

    setText(
        "gold-bias",
        result.bias
    );


    setText(
        "xau-bias",
        result.bias
    );



    /* Confidence */

    setText(
        "gold-confidence",
        result.confidence
            ? result.confidence + "%"
            : "--"
    );



    /* Entry */

    setText(
        "gold-entry",
        result.entry
            ? "$" +
              formatGoldPrice(
                  result.entry
              )
            : "--"
    );



    /* SL */

    setText(
        "gold-sl",
        result.sl
            ? "$" +
              formatGoldPrice(
                  result.sl
              )
            : "--"
    );


    setText(
        "gold-sl-pips",
        result.slPips
            ? formatPips(
                  result.slPips
              )
            : "--"
    );



    /* TP1 */

    setText(
        "gold-tp1",
        result.tp1
            ? "$" +
              formatGoldPrice(
                  result.tp1
              )
            : "--"
    );


    setText(
        "gold-tp1-pips",
        result.tp1Pips
            ? formatPips(
                  result.tp1Pips
              )
            : "--"
    );



    /* TP2 */

    setText(
        "gold-tp2",
        result.tp2
            ? "$" +
              formatGoldPrice(
                  result.tp2
              )
            : "--"
    );


    setText(
        "gold-tp2-pips",
        result.tp2Pips
            ? formatPips(
                  result.tp2Pips
              )
            : "--"
    );



    /* TP3 */

    setText(
        "gold-tp3",
        result.tp3
            ? "$" +
              formatGoldPrice(
                  result.tp3
              )
            : "--"
    );


    setText(
        "gold-tp3-pips",
        result.tp3Pips
            ? formatPips(
                  result.tp3Pips
              )
            : "--"
    );



    /* Score */

    setText(
        "bullish-score",
        result.bullishScore
    );


    setText(
        "bearish-score",
        result.bearishScore
    );



    /* Signal color */

    const signalElements = [

        document.getElementById(
            "gold-signal"
        ),

        document.getElementById(
            "xau-signal"
        ),

        document.getElementById(
            "signal-direction"
        )

    ];


    signalElements.forEach(
        element => {

            if (!element)
                return;


            element.classList.remove(
                "buy",
                "sell",
                "wait"
            );


            if (
                signal === "LONG"
            ) {

                element.classList.add(
                    "buy"
                );

            }


            else if (
                signal === "SHORT"
            ) {

                element.classList.add(
                    "sell"
                );

            }


            else {

                element.classList.add(
                    "wait"
                );

            }

        }
    );



    renderAnalysisText();

}



/* =========================================================
   ANALYSIS TEXT
   ========================================================= */

function renderAnalysisText() {

    const data =
        goldMarket.analysis;


    const result =
        goldMarket.signal;


    if (
        !data ||
        !result
    ) {

        return;

    }


    let text = "";



    if (
        result.signal ===
        "LONG"
    ) {

        text =
            "Bullish setup detected. " +
            "Price structure, momentum and " +
            "trend conditions are supporting " +
            "a potential LONG setup.";

    }



    else if (
        result.signal ===
        "SHORT"
    ) {

        text =
            "Bearish setup detected. " +
            "Market structure, momentum and " +
            "trend conditions are supporting " +
            "a potential SHORT setup.";

    }



    else {

        text =
            "WAIT — the market does not currently " +
            "have enough high-quality confirmation. " +
            "No forced trade is generated.";

    }



    const details =

        ` RSI: ${data.rsi.toFixed(2)} | ` +

        `MACD: ${data.macd > 0
            ? "Positive"
            : "Negative"} | ` +

        `VWAP: ${data.vwapState} | ` +

        `Structure: ${data.structure.status} | ` +

        `Volume: ${data.volume} | ` +

        `Momentum: ${data.momentumState} | ` +

        `HTF: ${data.htfBullish
            ? "Bullish"
            : data.htfBearish
                ? "Bearish"
                : "Neutral"} | ` +

        `Pattern: ${data.pattern}`;


    const finalText =
        text + details;



    setText(
        "gold-analysis",
        finalText
    );


    setText(
        "xau-analysis",
        finalText
    );


    setText(
        "live-analysis",
        finalText
    );

}



/* =========================================================
   INDICATOR UI
   ========================================================= */

function renderGoldIndicators() {

    const data =
        goldMarket.analysis;


    if (!data)
        return;



    setText(
        "gold-rsi",
        data.rsi.toFixed(2)
    );


    setText(
        "gold-ema",
        data.ema20 > data.ema50
            ? "Bullish"
            : "Bearish"
    );


    setText(
        "gold-macd",
        data.macd > 0
            ? "Positive"
            : "Negative"
    );


    setText(
        "gold-adx",
        data.trend
    );


    setText(
        "gold-vwap",
        data.priceAboveVWAP
            ? "Above"
            : "Below"
    );


    setText(
        "gold-atr",
        data.atr.toFixed(2)
    );


    setText(
        "gold-volume",
        data.volume
    );


    setText(
        "gold-structure",
        data.structure.status
    );


    setText(
        "gold-pattern",
        data.pattern
    );


    setText(
        "gold-support",
        data.support
            ? "$" +
              data.support.toFixed(2)
            : "--"
    );


    setText(
        "gold-resistance",
    

      
