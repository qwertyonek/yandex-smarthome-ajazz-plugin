const now = new Date();
const log = require('log4js').configure({
    appenders: {
        file: { type: 'file', filename: `./log/${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.log` }
    },
    categories: {
        default: { appenders: ['file'], level: 'info' }
    }
}).getLogger();

process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Rejection:', reason);
});

const ws = require('ws');

class Plugins {
    static language = 'en'; // Default fallback
    static globalSettings = {};
    getGlobalSettingsFlag = true;

    constructor() {
        if (Plugins.instance) {
            return Plugins.instance;
        }

        // Parse arguments safely
        const port = process.argv[3];
        const uuid = process.argv[5];
        const event = process.argv[7];

        try {
            if (process.argv[9]) {
                Plugins.language = JSON.parse(process.argv[9]).application.language;
            }
        } catch (e) {
            log.warn('Failed to parse language from argv', e);
        }

        log.info('Initializing plugin, port:', port);
        this.ws = new ws("ws://127.0.0.1:" + port);

        this.ws.on('open', () => {
            log.info('WebSocket connection opened');
            this.ws.send(JSON.stringify({ uuid: uuid, event: event }));
        });

        this.ws.on('close', () => {
            log.info('WebSocket connection closed');
            process.exit();
        });

        this.ws.on('error', (error) => {
            log.error('WebSocket error:', error);
        });

        this.ws.on('message', e => {
            if (this.getGlobalSettingsFlag) {
                this.getGlobalSettingsFlag = false;
                this.getGlobalSettings();
            }

            try {
                const data = JSON.parse(e.toString());
                log.info('Received message from StreamDeck:', data.event);

                const action = data.action?.split('.').pop();

                // Route to specific action handler if exists
                if (action && this[action] && this[action][data.event]) {
                    this[action][data.event](data);
                }

                // Handle global settings
                if (data.event === 'didReceiveGlobalSettings') {
                    Plugins.globalSettings = data.payload.settings;
                }

                // Route to general event handler
                if (this[data.event]) {
                    this[data.event](data);
                }

            } catch (err) {
                log.error('Error parsing message:', err);
            }
        });
        Plugins.instance = this;
    }

    setGlobalSettings(payload) {
        log.info('Setting global settings:', payload);
        Plugins.globalSettings = payload;
        this.ws.send(JSON.stringify({
            event: "setGlobalSettings",
            context: process.argv[5], payload
        }));
    }

    getGlobalSettings() {
        log.info('Requesting global settings');
        this.ws.send(JSON.stringify({
            event: "getGlobalSettings",
            context: process.argv[5],
        }));
    }

    setTitle(context, str) {
        this.ws.send(JSON.stringify({
            event: "setTitle",
            context, payload: {
                target: 0,
                title: str + ''
            }
        }));
    }

    setImage(context, url) {
        this.ws.send(JSON.stringify({
            event: "setImage",
            context, payload: {
                target: 0,
                image: url
            }
        }));
    }

    setState(context, state) {
        this.ws.send(JSON.stringify({
            event: "setState",
            context, payload: { state }
        }));
    }

    setSettings(context, payload) {
        log.info('Setting settings for context:', context, payload);
        this.ws.send(JSON.stringify({
            event: "setSettings",
            context, payload
        }));
    }

    showAlert(context) {
        this.ws.send(JSON.stringify({
            event: "showAlert",
            context
        }));
    }

    showOk(context) {
        this.ws.send(JSON.stringify({
            event: "showOk",
            context
        }));
    }

    sendToPropertyInspector(payload, context, action) {
        log.info('Sending to Property Inspector:', { payload, context, action });
        this.ws.send(JSON.stringify({
            action: action || Actions.currentAction,
            context: context || Actions.currentContext,
            payload, event: "sendToPropertyInspector"
        }));
    }

    openUrl(url) {
        this.ws.send(JSON.stringify({
            event: "openUrl",
            payload: { url }
        }));
    }
};

class Actions {
    constructor(data) {
        this.data = {};
        this.default = {};
        Object.assign(this, data);
    }

    static currentAction = null;
    static currentContext = null;
    static actions = {};

    propertyInspectorDidAppear(data) {
        log.info('Property Inspector appeared:', data.action, data.context);
        Actions.currentAction = data.action;
        Actions.currentContext = data.context;
        this._propertyInspectorDidAppear?.(data);
    }

    willAppear(data) {
        log.info('Action appeared:', data.action, data.context);
        Plugins.globalContext = data.context;
        Actions.actions[data.context] = data.action
        const { context, payload: { settings } } = data;
        this.data[context] = Object.assign({ ...this.default }, settings);
        this._willAppear?.(data);
    }

    didReceiveSettings(data) {
        log.info('Received settings for action:', data.context);
        this.data[data.context] = data.payload.settings;
        this._didReceiveSettings?.(data);
    }

    willDisappear(data) {
        log.info('Action disappeared:', data.context);
        this._willDisappear?.(data);
        delete this.data[data.context];
    }
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    subscribe(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    unsubscribe(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
}

module.exports = {
    log,
    Plugins,
    Actions,
    EventEmitter
};
