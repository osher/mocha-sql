var sut     = require('../lib/converter')
  ;
var path    = require('path')
  , util    = require('util')
  , Context = require('../lib/context').Context
  ;
module.exports = 
{ "lib/converter" :
  { "should be a strategy function that names 1 argument - ctx" : 
    function() {
        Should.exist(sut);
        sut.should.be.a.Function;
        sut.length.should.eql(1);
    }
  , "when used with a current-value that is" :
    { "string, boolean, number or a function " :
      { "should assign the value to ctx.result, and suites & curr-vals should stay the same" : 
        function() {
            var ctx = new Context()
              , curNu
              , suitesNu
              ;
            ctx.push({});
            ctx.push({});

            suitesNu = ctx.suites.slice();
            
            [ "string"
            , true
            , false
            , function() {}
            , 234
            , 1.23
            ].forEach(function(value) {
                ctx.cur[0] = value;
                curNu      = ctx.cur.slice();
                sut(ctx);
                //result
                ctx.result.should.eql(value);
                //cur stack untouched
                ctx.cur.should.eql(curNu);
                //suies stack untouched
                ctx.suites.should.eql(suitesNu);
            })
        }
      }
    , "when used with a current-value that is an object" :
      { "should recurse all it's values and copy them to the result" : 
        function() {
            [ {}
            , { a : {} }
            , { a : "a" , b : { skip: true } }
            , { a : { test1 : fStub, test2 : fStub }, b: { test1 : fStub, test2 : fStub , skip: true} }
            ].forEach(function(value) {
                ctx = new Context(value);
                sut(ctx);

                ctx.result.should.eql(value);
            })

            function fStub() {}
        }
      }
    , "when suite includes an array of strings attribute" : 
      { "should treat every string as path to ymal file and load suite from it" :
        function() {
            var ctx;
            ctx = new Context( { "wrap" :  [ "./dist/suite.yaml", "./dist/suite2.yaml" ] } );
            //inject path to fixture
            ctx.base = "./test/fixtures/minimal/";

            sut(ctx);

            util.inspect( ctx.result, { depth: 20 } ).should.eql(
              util.inspect(
                { wrap : 
                  { "minimal:" :
                    { beforeAll: function() {}
                    , "scenario-1:" : 
                      { "section-1:" : 
                        { "sql-1" : function() {}
                        } 
                      }
                    , afterAll: function() {}
                    } 
                  , "minimal2:" :
                    { beforeAll: function() {}
                    , "scenario-1:" : 
                      { "section-1:" : 
                        { "sql-1" : function() {}
                        } 
                      }
                    , afterAll: function() {}
                    } 
                  } 
                }
              , { depth: 20 }
              )
            )
        }
      }
    }
  }
}
/*

meta: 
  title  : minimal

#=======================================
scenario-1 :
  section-1: 
    - title     : sql-1
      sql       : SELECT NOW();
      
  
    AssertionError: expected 
{ 'minimal:':
  { beforeAll: [Function],
    'scenario-1:': 
      { 'section-1:': 
          { 'create some tables': [Function] 
          } 
      },
    afterAll: [Function] 
  } 
} to have property 'minimal'      

      
*/