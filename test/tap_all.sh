#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function tap_all () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH"/.. || return $?

  local TEST= BFN= LOG=
  local ERRCNT=0
  for TEST in anno-*/*[.-]test.js; do
    BFN="${TEST%.test.js}"
    LOG="${BFN//\//.}"
    LOG="$SELFPATH/$LOG.log"
    rm -- "$LOG" "${LOG%.log}.err" 2>/dev/null

    case "$BFN" in
      anno-store-sql/store-sql | \
      TODO:no_idea_why_exempted ) continue;;  # ignored tests
    esac

    npm run eval tap "$TEST" |& tee -- "$LOG"
    [ "${PIPESTATUS[*]}" == '0 0' ] && continue
    (( ERRCNT += 1 ))
    mv --no-target-directory -- "$LOG" "${LOG%.log}.err"
  done

  cd -- "$SELFPATH" || return $?
  mv --target-directory="$SELFPATH/success_logs" -- *.log

  echo "$ERRCNT errors."
  return "$ERRCNT"
}










tap_all "$@"; exit $?
