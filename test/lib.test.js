var sut = require('../')

module.exports = 
{ "mocha-sql" : 
  { "should be a module object" : 
    function() {
        Should.exist(sut);
        sut.should.be.an.Object;
    }
  , "API" : 
    { ".run" : 
      { "should be a function that accepts 1 argument - a suite descriptor" :
        function() {
            sut.should.have.property('run');
            sut.run.should.be.a.Function;
            sut.run.length.should.eql(1);
        }
      }
    , ".test" : 
      { "should be a function that accepts 1 argument - a suite descriptor" :
        function() {
            sut.should.have.property('run');
            sut.run.should.be.a.Function;
            sut.run.length.should.eql(1);
        }
      }
    }
  , ".run(suiteDescr)"  : "TBD!"
  , ".test(suiteDescr)" : "TBD!"
  }
}