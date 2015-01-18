var convertSync = require('./converter')
  , Context = require('./context')
  , args = require('./args')
  , db = require('./db')
  ;
module.exports =
  { test: 
    /**
        runs the suite within test context.
        i.e - adds the following setup / teardown
          setup:
            - connect as db admin
            - create test db
            - disconnect 
          
          teardown: 
            - connect as db admin
            - drop test db
            - disconnect 
     */
    function(suiteDescr) { 
        var ctx = Context.init(suiteDescr)
          , suite
          ;
        //load config settings
        ctx.config(args);

        //convert declerative parts to mocha-ui-exports suites
        convertSync(ctx);
        suite = ctx.result;

        //using test-db!
        //handle setup && teardown of test db
        suite.beforeAll = 
          function(done) {
              //apply defaults of tartet test db
              var seed = rnd();
              if (!ctx.target.database) ctx.target.database = "testdb_" + seed
              if (!ctx.target.user    ) ctx.target.user     = "testuser_" + seed
              if (!ctx.target.password) ctx.target.password = "testpwd";
              var cmdSet = 
                [ "CREATE USER " + ctx.target.user + " PASSWORD '" + ctx.target.password + "';"
                , "CREATE DATABASE " + ctx.target.database + " OWNER " + ctx.target.user + ";"
                , "GRANT ALL PRIVILEGES ON DATABASE " + ctx.target.database + " TO " + ctx.target.user + ";"
                ]
              ;

              db.cmdSet( ctx.adminDb, cmdSet, done);
          };

        suite.afterAll = 
          function(done) {
              var cmdSet = 
                [ "DROP DATABASE " + ctx.target.database + ";"
                , "DROP USER " + ctx.target.user + ";"
                ]
              ;

              db.cmdSet( ctx.adminDb, cmdSet, done);
          };

        return { "TEST CONTEXT" :  suite };       
    }
  , run :
    /**
        runs the suite on target DB - as is, relaying on defaults or switches
    */
    function run(suiteDescr) {
        var ctx = Context.init(suiteDescr)
          ;

        //load config settings 
        ctx.config(args);

        //convert declerative parts to mocha-ui-exports suites
        convertSync(ctx);

        return ctx.result
    }
  };

function rnd() {
    return Math.floor( Math.random() * 100000)
}