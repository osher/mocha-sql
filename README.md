mocha-sql
=========

Goals:
------
1 - simple readable suite files, aiming DBA & developers
2 - let them describe not only db-init/db-migrate/db-rollback flows, 
    but also support them to describe scanity tests for their moves.
3 - allow running the suites inside CI flows
4 - allow running the suites on production, the same way they passed in CI
5 - take advantage of Mocha's 
   * well-structured waterfall
   * well handled startup / teardown hooks
   * good looking `spec` reporter


exposes  CLI commands:
----------------------

*db-apply*: 
  Synopsis: `db-apply <cmd> [options]`
  runs the globaly installed mocha with ./cmd/<cmd>.js - expected on USER'S project

`<cmd>`
-------
    By convention, user's project should support: 
     - init (for all DB projects, all versions)
     - migrate (from version #2 and above )
     - migrate-rollback (from version #2 and above )

Options
-------
 -h, --host
 -p, --port
 -u, --user
 -w, --password
 -d, --database   (ignored on test context)

Notes:
======
The utility assumes you have [mocha] available - which means, 
either as dependency, or installed globally.
The utility assumes you have [mocha-ui-exports] as local dependency 
(it is being required as UI for mocha).
There's an issue on the road map to remove this dependency - we'll see about that...



TODO / Roadmap
==============
Issues here listed not by priority...

- connect to travis CI
- start up WIKI & knowledgebase
- add CLI command to create CI user
- add CLI command to create boilerplate project
- support DBs other than postgres
- decouple from mocha-ui-exports: find a way to create suites directly from the YMAL

Contribute
==========
Sure, that's why it's here! PRs, as usual.
Just run the tests (whatever there are...)


Lisence
=======

MIT, and that's it :)

