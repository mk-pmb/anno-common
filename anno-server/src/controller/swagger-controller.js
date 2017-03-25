const {Router} = require('express')
const yaml = require('js-yaml')
const fs = require('fs')

const mustache = require('mustache')

module.exports = ({config}) => {

    const router = Router()

    const swaggerDef = yaml.safeLoad(mustache.render(
        fs.readFileSync(__dirname + '/../../swagger-schema.yml', {encoding: 'utf-8'}),
        {config}))
    swaggerDef.definitions = require('@kba/anno-schema').definitions

    const swaggerDefAsJSON = JSON.stringify(swaggerDef, null, 2)
    function sendJSON(req, resp) {
        resp.status(200)
        resp.header('Content-Type', 'application/json')
        resp.send(swaggerDefAsJSON)
    }

    const swaggerDefAsYAML = yaml.safeDump(swaggerDef)
    function sendYAML(req, resp) {
        resp.status(200)
        resp.header('Content-Type', 'text/yaml')
        resp.send(swaggerDefAsYAML)
    }

    router.get('/json', sendJSON)
    router.get('/yaml', sendYAML)
    router.get('/', (req, resp) => {
        if (req.header('Accept').match('text/html')) {
            resp.status(302)
            resp.header('Location', `${config.BASE_URL}/swagger-ui/dist/index.html?url=/swagger`)
            return resp.end()
        }
        return (req.header('Accept').match('text/yaml'))
            ? sendYAML(req, resp)
            : sendJSON(req, resp)
    })

    return router
}
