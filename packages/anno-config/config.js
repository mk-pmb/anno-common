const PREFIX = 'ANNO';
const PREFIX_RE = new RegExp(`^${PREFIX}_`)
const DEFAULTS = {
    DEBUG: 'false',
    // NEDB_DIR: __dirname + '/' + '../nedb',
    STORE: '@kba/anno-store-nedb',
}

function loadConfig(localDefaults={}) {

    const CONFIG = JSON.parse(JSON.stringify(DEFAULTS))
    Object.assign(CONFIG, JSON.parse(JSON.stringify(localDefaults)))

    Object.keys(process.env)
        .filter(k => k.match(PREFIX_RE))
        .forEach(k => CONFIG[k.replace(PREFIX_RE, '')] = process.env[k])

    Object.keys(CONFIG)
        .forEach(k => {
            if (CONFIG[k].match(/^true|false$/))
                CONFIG[k] = CONFIG[k] !== 'false'
            process.env[`${PREFIX}_${k}`] = CONFIG[k]
        })

    return CONFIG
}

// https://github.com/1602/jugglingdb/blob/master/lib/utils.js
function safeRequire(require, module) {
    try {
        return require(module);
    } catch (e) {
        console.error(e)
        console.error(`Run "npm install --global ${module}"  to use anno ${module}`);
        process.exit(1);
    }
}

module.exports = {
    loadConfig, safeRequire
}