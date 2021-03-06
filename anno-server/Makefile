SHELL = bash
MAKEFLAGS += --no-print-directory
ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

TEMPDIR = $(ROOT_DIR)../temp
LOGFILE = $(TEMPDIR)/server.log
PIDFILE = $(TEMPDIR)/server.pid

RESTART_TIMEOUT = 10

WARN = echo -ne "\x1b[31;1m"

.PHONY: watch
watch: swagger-ui
	cd $(ROOT_DIR) ; pm2 startOrRestart --no-daemon pm2.dev.yml

.PHONY: serve
serve: swagger-ui
	lerna bootstrap --hoist
	node server.js

.PHONY: start
start:
	mkdir -p $(TEMPDIR)
	if [ ! -e $(PIDFILE) ];then \
		ANNO_STORE='@kba/anno-store-file' \
		ANNO_NEDB_DIR='$(TEMPDIR)' \
		node server.js > $(LOGFILE) 2>&1 & echo $$! > $(PIDFILE) \
		&& echo "Server started on localhost:3000"; \
	fi

.PHONY: stop
stop:
	-kill `cat $(PIDFILE)`; rm "$(PIDFILE)"

.PHONY: swagger-ui
swagger-ui:
	sed -i \
		-e 's,docExpansion: "none",docExpansion: "list",' \
		-e 's,jsonEditor: false,jsonEditor: true,' \
		public/swagger-ui/dist/index.html
