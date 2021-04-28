
CI tests
========

For CI tests, see [`../.gitlab-ci.yml`](../.gitlab-ci.yml).



Dev tests 2018 (in [Makefile](../Makefile))
===========================================

The old dev test mechanism from 2018…

  * expects MongoDB to be installed on the test host.
  * has the usual Makefile complexities
  * starts its own instance of MongoDB.
  * relies on hard-coded paths for CLI commands provided by node_modules.



Dev tests 2021 (test/)
======================

The 2021 edition of the dev test mechanism

  * expects a service on `localhost:32123` that behaves like a MongoDB.
    * It could be locally installed, dockerized, port-forwarded, whatever.
    * No guarantees about what the tests will do to the data in it,
      so better be safe than sorry.
  * uses npm to run CLI commands provided by node_modules.
  * expects ports 3000 and 3008 to be unused and available for TCP listening.

