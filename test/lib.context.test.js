var sut = require('../lib/context')
  , ctx
  , obj1 = {}
  ;

module.exports = 
{ "lib/context" : 
  { "should be a module that implements" : 
    { ".init - factory function, names 1 argument - suite" :
      function() {
          Should.exist(sut);
          sut.should.be.an.Object;
          sut.should.have.property('init');
          sut.init.should.be.a.Function;
          sut.init.length.should.eql(1);
      }
    }
  , ".init(suite)" : 
    { "is singleton once initiated - should always return the same value" : 
      function() {
          ctx = sut.init();
          ctx.should.equal(sut.init());
          ctx.should.equal(sut.init({}));
      }
    }
  , "obtained initiated Context instance" : 
    { "#suites" : 
      { "should be an array" : 
        function() {
            ctx.should.have.property("suites");
            ctx.suites.should.be.an.Array;
        }
      }
    , "#cur" : 
      { "should be an array" : 
        function() {
            ctx.should.have.property("cur");
            ctx.cur.should.be.an.Array;
        }
      }
    , "#base" : 
      { "should be a string - defaulted to '.'" : 
        function() {
            ctx.should.have.property("base");
            ctx.base.should.eql(".");
        }
      }
    , "#config" : 
      { "should be a setup function that names 1 argument - args" : 
        function() {
            ctx.should.have.property("config");
            ctx.config.should.be.a.Function;
            ctx.config.length.should.eql(1);
        }
      , "when used with full parameters" : 
        { beforeAll: 
          function() {
              ctx.config( 
                { host: "testhost"
                , port: 8833
                , user : "testuser"
                , password: "testpwd"
                , database: "testdb" 
                } 
              , { PSQL_CI_USER :  "ciuser"
                , PSQL_CI_PWD  :  "cipwd"
                , PSQL_CI_DB   :  "cidb"
                }
              )
          }
        , "should initiate this.target with connection settings from args": 
          function() {
              ctx.should.have.property("target"
              , { host    : "testhost"
                , port    : 8833
                , user    : "testuser"
                , password: "testpwd"
                , database: "testdb"
                }
              );
          }
        , "should initiate this.ciAdmin with CI user settings from args & env" : 
          function() {
              ctx.should.have.property("ciAdmin"
              , { host    : "testhost"
                , port    : 8833
                , user    : "ciuser"
                , password: "cipwd"
                , database: "cidb"
                }
              );              
          }
        }
      , "when used with no empty args" : 
        { "should throw a friendly error": 
          function() {
              (function() {
                  ctx.config( 
                    { } 
                  , { }
                  )
              }).should.throw
          }
        }
      , "when used with minimal args" : 
        { beforeAll: 
          function() {
              ctx.config( 
                { database: "testdb" } 
              , { }
              )
          }
        , "should initiate this.target with default connection settings": 
          function() {
              ctx.should.have.property("target"
              , { host    : "localhost"
                , port    : 5432
                , user    : "postgres"
                , password: null
                , database: "testdb"
                }
              );
          }
        , "should initiate this.ciAdmin with CI user settings" : 
          function() {
              ctx.should.have.property("ciAdmin"
              , { host    : "localhost"
                , port    : 5432
                , user    : "postgres"
                , password: null
                , database: "postgres"
                }
              );              
          }
        }
      }
    , "#push" : 
      { beforeAll: 
        function() {
            sut.clear();
            ctx = sut.init();
        }
      , "should be a method that names 1 argument - value" : 
        function() {
            ctx.should.have.property("push");
            ctx.push.should.be.a.Function;
            ctx.push.length.should.eql(1);
        }
      , "when used" : 
        { beforeAll: 
          function() { ctx.push( obj1 ) }
        , "should push the value to the #cur" :
          function() {
              ctx.cur.length.should.eql(1);
              ctx.cur[0].should.eql( obj1 );
          }
        , "should push a new object to the #suites, and save it on #result" : 
          function() {
              ctx.suites.length.should.eql(1);
              ctx.suites[0].should.eql( ctx.result );
          }
        }
      }
    , "#pop" : 
      { beforeAll: 
        function() {
            sut.clear();
            ctx = sut.init();
            ctx.push(obj1);
            ctx.push({});
        }
      , "should be a method that names 1 argument - value" : 
        function() {
            ctx.should.have.property("push");
            ctx.push.should.be.a.Function;
            ctx.push.length.should.eql(1);
        }
      , "when used" : 
        { beforeAll: 
          function() { ctx.pop() }
        , "should pull the value from #cur" :
          function() {
              ctx.cur.length.should.eql(1);
              ctx.cur[0].should.eql( obj1 );
          }
        , "should pull the suite object to the #suites, and save it on #result" : 
          function() {
              ctx.suites.length.should.eql(1);
              ctx.result.should.be.an.Object;
          }
        }
      }
    , "#resolvePath" : null
    , "#readFileSync" : null
    }
  }
}