var pg    = require('pg')
  , async = require('async')
  , util  = require('util')
  , cmd   = 
    { CREATE_USER     : "CREATE USER %s PASSWORD '%s';"
    , CREATE_DATABASE : "CREATE DATABASE %s OWNER %s;"
    , GRANT_ALL       : "GRANT ALL PRIVILEGES ON DATABASE %s TO %s;"
    , DROP_DATABASE   : "DROP DATABASE %s;"
    , DROP_USER       : "DROP USER %s;"
    }
  , db
  ;

module.exports = db = 
  { connect       : connect
  , disconnect    : disconnect
  , createTestCtx : createTestCtx
  , cleanTestCtx  : cleanTestCtx

  //work exposed for ease of testing
  , cmdSet        : cmdSet
  , cmd           : formatCmd
  };

//I decided to work exposed for ease of testing
Object.keys(cmd).forEach(function(cmd) {
    module.exports[ cmd ] = function() {
        var args = Array.prototype.slice.apply(arguments);
        args.unshift(cmd);
        return formatCmd.apply(null, args);
    }
});

function createTestCtx(ctx, done) {
    db.cmdSet( ctx.adminDb
    , [ db.CREATE_USER    (ctx.target.user    , ctx.target.password )
      , db.CREATE_DATABASE(ctx.target.database, ctx.target.user     )
      , db.GRANT_ALL      (ctx.target.database, ctx.target.user     )
      ]
    , done
    );    
}

function cleanTestCtx(ctx, done) {
    db.cmdSet( ctx.adminDb
    , [ db.DROP_DATABASE(ctx.target.database)
      , db.DROP_USER    (ctx.target.user    )
      ]
    , done
    );
}


function formatCmd(cmdCode/*, param, param, param...*/) {
    var sCmd = cmd[cmdCode]
      , args
      ;
    if (!sCmd) 
        throw new Error("no such command: " + cmdCode);
    
    if (sCmd.split('%s').length != arguments.length)
        throw new Error(
          util.format( 
            [ "ERROR: mismatch number of arguments"
            , " the command `%s` requires exactly %s arguments"
            , " however, the command and the arguments are: "
            , "    %s"
            ].join("\n")
          , [ cmdCode
            , (sCmd.split('%s').length - 1)
            , Array.prototype.join.apply(arguments,[","])
            ]
          )
        );

    args    = Array.prototype.slice.apply(arguments);
    args[0] = cmd[cmdCode];

    return util.format.apply( util, args );
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