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
        var step = 
            { sql : "SELECT 1;" 
            , expect : 
              { rows : 
                [ [1,"one"] 
                , [2,"two"]
                ]
              }
            } 
          , ctx = new Context({})
          , expectedErr = new Error("wanted error")
          , unexpectedErr = new Error("error unexpected")
          , yieldedErr 
          , fStep
          ;
        ctx.client = 
          { query:
            function(sql, done) { 
                switch(sql) {
                  case 'fail-expected': 
                    return done(expectedErr);
                  case 'fail-unexpected':
                    return done(unexpectedErr);
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
              fStep = sut(step, ctx);
          }
        , "should return an async step function" : 
          function() {
              Should.exist(fStep);
              fStep.should.be.a.Function;
              fStep.name.should.eql("sql_step");
              fStep.length.should.eql(1);
          }
        , "when using the step" : 
          { "and step yields error when no error is expected" :
            { beforeAll: 
              function() {
                  step.sql = "fail-unexpected"
              }
            , "should yield the error" :
              function(done) {
                  fStep(function(e) {
                      Should.exist(e);
                      e.should.equal(unexpectedErr)
                      done()
                  })
              }
            , "should keep a reference to the error on the ctx" :
              function() {
                  ctx.should.have.property("error", unexpectedErr);
              }
            , afterAll: 
              function() {
                  delete ctx.error;
              }
            }
          , "and step yields no error when an error is expected" : 
            { beforeAll: 
              function() {
                  step.sql = "pass";
                  step["expect-error"] = "some error";
              }
            , "should yield a friendly error" :
              function(done) {
                  fStep(function(e) {
                      Should.exist(e);
                      e.message.should.match(/Expected error did not occur/);
                      done()
                  })
              }
            , "should keep a reference to the error on the ctx" :
              function() {
                  ctx.should.have.property("error");
                  ctx.error.should.be.an.Error;
              }
            , afterAll:
              function() {
                  delete ctx.error;
                  delete step["expect-error"];
              }
            }
          , "and step yields an error different than the expected error" :
            { beforeAll: 
              function() {
                  step.sql = "fail-unexpected";
                  step["expect-error"] = "wanted error";
              }
            , "should yield a friendly error" :
              function(done) {
                  fStep(function(e) {
                      Should.exist(e);
                      e.message.should.match(/expected .* but got/i);
                      done()
                  })
              }
            , "should keep a reference to the error on the ctx" :
              function() {
                  ctx.should.have.property("error");
                  ctx.error.should.be.an.Error;
              }
            , afterAll:
              function() {
                  delete ctx.error;
                  delete step["expect-error"];
              }
            }
          , "and step yields an error that is expected" :
            { beforeAll: 
              function() {
                  step.sql = "fail-expected";
                  step["expect-error"] = "wanted error"
              }
            , "should not fail" :
              function(done) {
                  fStep(function(e) {
                      Should.not.exist(e);
                      done()
                  })
              }
            , afterAll: 
              function() {
                  delete step["expect-error"];
              }
            }
          , "and step yields recordset that does not match expectations" :
            { beforeAll: 
              function() {
                  step.sql = "result-unexpected";
              }
            , "should yield a friendly error" :
              function(done) {
                  fStep(function(e) {
                      Should.exist(e);
                      yieldedErr = e;
                      done()
                  })
              }
            , "the yielded error should contain a diff" : 
              function() {
                  yieldedErr.message.should
                    .match(/Results returned by query do not match expected values in CSV/)
                    .match(/expected is in.*purple/)
                    .match(/found +is in.*red/)
              }
            }
          , "and step yields recordset that matches csv" :
            { beforeAll: 
              function() {
                  step.sql = "pass normal";
              }
            , "should not fail" :
              function(done) {
                  fStep(function(e) {
                      Should.not.exist(e);
                      done()
                  })
              }
            }
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