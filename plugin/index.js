const { Plugins, Actions, log } = require('./utils/plugin');
const { getIcon } = require('./utils/icons');
const https = require('https');

const plugin = new Plugins('yandex-smart-home');

// --- Yandex API Helper ---
async function yandexRequest(token, path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.iot.yandex.net',
            path: `/v1.0${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(data ? JSON.parse(data) : null);
                    } catch (e) {
                        resolve(null);
                    }
                } else {
                    reject(new Error(`Status Code: ${res.statusCode}, Body: ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function fetchUserInfo(token) {
    return await yandexRequest(token, '/user/info');
}

async function executeScenario(token, scenarioId) {
    return await yandexRequest(token, `/scenarios/${scenarioId}/actions`, 'POST');
}

async function toggleDevice(token, deviceId, newState) {
    const body = {
        devices: [{
            id: deviceId,
            actions: [{
                type: "devices.capabilities.on_off",
                state: { instance: "on", value: newState }
            }]
        }]
    };
    return await yandexRequest(token, '/devices/actions', 'POST', body);
}

async function getDeviceState(token, deviceId) {
    const data = await yandexRequest(token, `/devices/${deviceId}`);
    if (data && data.capabilities) {
        const onOff = data.capabilities.find(c => c.type === 'devices.capabilities.on_off');
        if (onOff) {
            return {
                isOn: onOff.state.value,
                type: data.type
            };
        }
    }
    return null;
}

// --- Action Handler ---

plugin["control"] = new Actions({
    default: {
        type: "scenario",
        objectId: ""
    },

    async _willAppear({ context, payload }) {
        log.info("Control Action Appeared:", context);
        if (!this.data[context]) {
            this.data[context] = { ...this.default };
        }

        // Set initial gray icon to avoid colorful flash
        const settings = this.data[context];
        if (settings.type === 'device') {
            const grayIcon = getIcon('devices.types.other', false);
            plugin.setImage(context, grayIcon);
        }

        this.updateButtonState(context);

        // Start periodic state refresh
        if (!this.intervals) this.intervals = {};

        if (this.intervals[context]) {
            clearInterval(this.intervals[context]);
        }

        this.intervals[context] = setInterval(() => {
            this.updateButtonState(context);
        }, 10000);
    },

    _willDisappear({ context }) {
        log.info("Control Action Disappeared:", context);
        if (this.intervals && this.intervals[context]) {
            clearInterval(this.intervals[context]);
            delete this.intervals[context];
        }
    },

    async updateButtonState(context) {
        const settings = this.data[context];
        if (!settings || !settings.objectId || settings.type !== 'device') return;

        const token = Plugins.globalSettings.token;
        if (!token) return;

        try {
            const stateData = await getDeviceState(token, settings.objectId);
            if (stateData) {
                const { isOn, type } = stateData;

                plugin.setState(context, isOn ? 1 : 0);

                const iconSvg = getIcon(type, isOn);
                plugin.setImage(context, iconSvg);
            }
        } catch (e) {
            log.error("Failed to update device state:", e);
        }
    },

    async keyUp({ context, payload }) {
        const settings = this.data[context];
        const { type, objectId } = settings;

        const token = Plugins.globalSettings.token;

        if (!token || !objectId) {
            log.warn("Settings missing for context:", context);
            plugin.showAlert(context);
            return;
        }

        try {
            if (type === 'scenario') {
                log.info(`Executing scenario ${objectId}...`);
                await executeScenario(token, objectId);
                plugin.showOk(context);
            } else if (type === 'device') {
                log.info(`Toggling device ${objectId}...`);
                const stateData = await getDeviceState(token, objectId);
                if (stateData) {
                    const newState = !stateData.isOn;
                    await toggleDevice(token, objectId, newState);

                    plugin.setState(context, newState ? 1 : 0);
                    const iconSvg = getIcon(stateData.type, newState);
                    plugin.setImage(context, iconSvg);
                }
            }
        } catch (error) {
            log.error(`Failed to execute action for ${objectId}:`, error);
            plugin.showAlert(context);
        }
    },

    sendToPlugin({ context, payload }) {
        log.info("Received message from PI:", payload.type);

        if (payload.type === 'updateSettings') {
            const newSettings = {
                ...this.data[context],
                ...payload.settings
            };
            this.data[context] = newSettings;
            plugin.setSettings(context, newSettings);

            if (newSettings.type === 'device') {
                this.updateButtonState(context);
            }
        }
        else if (payload.type === 'fetchData') {
            this.handleFetchData(context, payload.token);
        }
    },

    async handleFetchData(context, token) {
        try {
            log.info("Fetching user info for PI...");
            const data = await fetchUserInfo(token);

            const scenarios = data.scenarios.map(s => ({ id: s.id, name: s.name }));
            const devices = data.devices
                .filter(d => d.capabilities.some(c => c.type === 'devices.capabilities.on_off'))
                .map(d => ({ id: d.id, name: d.name }));

            plugin.sendToPropertyInspector({
                type: 'dataList',
                scenarios: scenarios,
                devices: devices
            }, context);

        } catch (e) {
            log.error("Failed to fetch user info:", e);
            plugin.sendToPropertyInspector({
                type: 'error',
                message: e.message
            }, context);
        }
    }
});
