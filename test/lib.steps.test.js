var sut     = require('../lib/steps')
  , Context = require('../lib/context').Context
  , db      = require('../lib/db')
  , clog    = console.log
  ;
module.exports = 
{ "lib/steps" : 
  { "should be a factory function that accepts two arguments - step, ctx ": 
    function() {
        Should.exist(sut);
        sut.should.be.a.Function;
        sut.length.should.eql(2);
    }
  , "when provided with a step of no supported type" : 
    { "shold throw a friendly error" : 
      function() {
          var err
          try {
              sut( { } )
          } catch (ex) {
              err = ex
          }
          Should.exist(err);
          err.message.should.match(/step type is not recognized/)
      }
    }
  , "when provided with a step with two attribute that may indicate it's type" : 
    { "shold throw a friendly error" : 
      function() {
          var err
          try {
              sut( { sql : "aha", "sql-file": "oups" } )
          } catch (ex) {
              err = ex
          }
          Should.exist(err);
          err.message.should.match(/cannot decide on step type/)
      }
    }
  , "when provided with a valid 'sql' step" : 
    block(function() {
        var fStep
          , ctx = new Context({})
          , err = new Error("wanted error");
          ;
        context.client = 
          { query:
            function(sql, done) { 
                switch(sql) {
                  case 'fail-expected': 
                    return done(err);
                  case 'fail-unexpected':
                    return done(new Error("error unexpected"));
                  case 'result-unexpected' :
                    return done(
                      null
                    , { rows : 
                        [ [1,"one"] 
                        , [2,"tAo"]
                        ]
                      }
                    )
                  default:
                    return done(
                      null
                    , { rows : 
                        [ [1,"one"] 
                        , [2,"two"]
                        ]
                      }
                    )
                }
            }
          }
        return {
          "should not fail" : 
          function() {
              fStep = sut(
                { sql : "SELECT 1;" 
                , expect : 
                  { rows : 
                    [ [1,"one"] 
                    , [2,"two"]
                    ]
                  }
                } 
              );
          }
        , "should return an async step function" : 
          function() {
              Should.exist(fStep);
              fStep.should.be.a.Function;
              fStep.name.should.eql("sql_step");
              fStep.length.should.eql(1);
          }
        , "when using the step" : 
          { "and step returns error" :
            null
          , "and step returns recordset that does not match" :
            null
          } 
        }
    })
  , "when provided with a valid 'sql-file' step with 'expect-csv' validator" : 
    block(function() {
        var fStep
          , files = []
          , ctx = new Context({})
          , step = 
            { "sql-file"   : "test-sql-file.sql" 
            , "expect-csv" : "test-csv.csv"
            }
          ;

        ctx.readFileSync = function(file) { files.push(file); return "mock," + file }

        return {
          "should not fail" : 
          function() {
              console.log = function(){};
              fStep = sut(step, ctx);
              console.log = clog;
          }
        , "should read the sql file synchronously" : 
          function() {
              files.should.eql(
                [ "test-sql-file.sql"
                , "test-csv.csv"
                ]
              );
          }
        , "should return an async step function" : 
          function() {
              Should.exist(fStep);
              fStep.should.be.a.Function;
              fStep.name.should.eql("sql_step");
              fStep.length.should.eql(1);
          }
        , "should populate the step.sql attribute with the file content" : 
          function() {
              step.sql.should.eql( db.blockWrap( "mock,test-sql-file.sql" ) );
          }
        , "should populate the step.expect attribute with the file content" : 
          function() {
              step.expect.should.eql({ rows: [ [ 'mock','test-csv.csv' ] ] });
          }
        }
    })
  , "when provided with valid 'sql-files' step" : 
    block(function() {
        var fStep
          , files = []
          , ctx = new Context({})
          , step = 
            { "sql-files"   : 
              [ "test-sql-file1.sql" 
              , "test-sql-file2.sql"
              , "test-sql-file3.sql"
              ]
            }
          ;

        ctx.readFileSync = function(file) { files.push(file); return "mock:" + file }

        return {
          "should not fail" : 
          function() {
              console.log = function(){};
              fStep = sut(step, ctx);
              console.log = clog;
          }
        , "should return a mocha suite object with a test step per file" : 
          function() {
              Should.exist(fStep);
              fStep.should.be.an.Object;
              step["sql-files"].forEach(function(file) {
                  var f;
                  fStep.should.have.property(file);
                  (f = fStep[file]).should.be.a.Function;
                  f.length.should.eql(1);
                  f.name.should.eql("sql_step");
              })
          }
        }
    })
  }
}