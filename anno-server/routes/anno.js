const querystring = require('querystring')
const {Router}    = require('express')
const prune       = require('object-prune')
const {envyConf}  = require('envyconf')

module.exports = ({store}) => {

    function getAnnotation(req, resp, next) {
        store.get(req.params.annoId, req.annoOptions, (err, doc) => {
            if (err) return next(err)
            resp.header('Location', doc.id)
            resp.header('Link', '<http://www.w3.org/ns/ldp#Resource>; rel="type"')
            resp.header('Vary', 'Accept')
            resp.header('Content-Type', 'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"')
            resp.jsonld = doc
            return next()
        })
    }

    function getCollection(req, resp, next) {
        // TODO see _urlFromId in store.js
        const {BASE_URL, BASE_PATH} = envyConf('ANNO')
        var colUrl = `${BASE_URL}${BASE_PATH}/anno/`
        const qs = querystring.stringify(req.query)
        if (qs) colUrl += '?' + qs
        const searchParams = {}
        Object.keys(req.query).forEach(k => {
            if (!(k.startsWith('metadata.'))) {
                searchParams[k] = req.query[k]
            }
        })
        store.search(searchParams, req.annoOptions, (err, docs) => {
            if (err) return next(err)
            resp.header('Content-Location', colUrl)
            resp.header('Vary', 'Accept, Prefer')
            resp.header('Link',
                '<http://www.w3.org/TR/annotation-protocol/>; rel="http://www.w3.org/ns/ldp#constrainedBy"')
            resp.header('Link',
                '<http://www.w3.org/TR/annotation-protocol/>; rel="http://www.w3.org/ns/ldp#constrainedBy"')
            resp.header('Content-Type', 'application/ld+json')

            resp.header('Link', '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"')
            const col = {
                '@context': 'http://www.w3.org/ns/anno.jsonld',
                type: ['BasicContainer', 'AnnotationCollection'],
                id: colUrl,
                total: docs.length,
            }
            // TODO paging
            if (col.total > 0) {
                Object.assign(col, {
                    first: {
                        id: colUrl,
                        startIndex: 0,
                        items: docs,
                    },
                    last: { id: colUrl },
                })
            }
            resp.jsonld = col
            next()
        })
    }


    const router = Router()

    //----------------------------------------------------------------
    // Web Annotation Protocol
    //----------------------------------------------------------------

    // 'Allow' header
    router.use((req, resp, next) => {
        resp.header('Allow', 'GET, HEAD, OPTIONS, DELETE, PUT')
        next()
    })

    //
    // HEAD /anno
    //
    // NOTE: HEAD must be defined before GET because express
    //
    router.head('/', (req, resp, next) => {
        req.query.metadataOnly = true
        next()
    }, getCollection)

    //
    // GET /anno
    //
    router.get('/', getCollection)

    //
    // POST /anno
    //
    router.post('/', (req, resp, next) => {
        const anno = prune(req.body)
        store.create(anno, req.annoOptions, (err, anno) => {
            if (err) return next(err)
            resp.status(201)
            req.params.annoId = anno.id
            return getAnnotation(req, resp, next)
        })
    })

    //
    // POST /anno/import
    //
    router.post('/import', (req, resp, next) => {
        const anno = prune(req.body)
        store.import(anno, req.annoOptions, (err, doc) => {
            if (err) return next(err)
            resp.status(201)
            req.params.annoId = doc.id
            return getAnnotation(req, resp, next)
        })
    })


    //
    // HEAD /anno/{annoId}
    //
    // NOTE: HEAD must be defined before GET because express
    //
    router.head('/:annoId', (req, resp, next) => {
        req.query.metadataOnly = true
        next()
    }, getAnnotation)

    //
    // GET /anno/{annoId}
    //
    router.get('/:annoId', getAnnotation)

    //
    // PUT /anno/{annoId}
    //
    router.put('/:annoId', (req, resp, next) => {
        const anno = prune(req.body)
        store.revise(req.params.annoId, anno, req.annoOptions, (err, doc) => {
            if (err) return next(err)
            resp.status(201)
            req.params.annoId = doc.id
            return getAnnotation(req, resp, next)
        })
    })

    //
    // DELETE /anno/{annoId}
    //
    router.delete('/:annoId', (req, resp, next) => {
        store.delete(req.params.annoId, req.annoOptions, (err, doc) => {
            if (err) return next(err)
            resp.status(204)
            return resp.send(doc)
        })
    })

    //----------------------------------------------------------------
    // Extensions
    //----------------------------------------------------------------

    //
    // DELETE /anno/{annoId}/!
    //
    router.delete('/:annoId/!', (req, resp, next) => {
        req.annoOptions.forceDelete = true
        store.delete(req.params.annoId, req.annoOptions, (err) => {
            if (err) return next(err)
            resp.status(204)
            return resp.end()
        })
    })

    //
    // POST /anno/{annoId}/reply
    //
    router.post('/:annoId/reply', (req, resp, next) => {
        store.reply(req.params.annoId, req.body, req.annoOptions, (err, doc) => {
            if (err) return next(err)
            return resp.send(doc)
        })
    })

    //
    // DELETE /anno
    //
    router.delete('/', (req, resp, next) => {
        store.wipe(req.annoOptions, (err) => {
            if (err) return next(err)
            resp.end()
        })
    })

    //
    // POST /anno/acl
    //
    router.post('/acl', (req, resp, next) => {
        const urls = req.body.targets
        store.aclCheck(urls, req.annoOptions, (err, perms) => {
            if (err) return next(err)
            return resp.send(perms)
        })
    })

    //----------------------------------------------------------------
    // Content-Negotiation
    //----------------------------------------------------------------
    router.use(require('../middleware/content-negotiation')())

    //----------------------------------------------------------------
    // Error Handler
    //----------------------------------------------------------------
    router.use(require('../middleware/error-handler')())

    return router
}