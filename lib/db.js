var pg = require('pg')
  , async = require('async')
  ;

module.exports = 
{ cmdSet: cmdSet
, connect: connect
, disconnect: disconnect
}


function cmdSet(db, arrBatch, done) {
    pg.connect(db, function(e, c, release) {
        if (e) return done(e);

        async.waterfall(
          arrBatch.map(function(SQL) { return c.query.bind(c, SQL ) } )
        , function(e,r) {
              release();
              done(e);
          }
        )
    })
}

function connect(ctx, ready) {
    var client = new pg.Client(ctx.target);

    client.connect(function(e) {
        if (e) return ready(e);
        ctx.client = client;
        ready();
    })
}

function disconnect(ctx, done) {
    ctx.client.end();
    delete ctx.client;
    done();
}