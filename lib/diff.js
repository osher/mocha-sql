require('colors');
var diff = require('diff');

module.exports = 
{ words: 
  function(expected, found) { 
      return difChars(diff.diffWords(expected, found))    
  }
}

function difChars(parts, linebreak) {  
    var line = 1;
    
    return (
      "   1| ".gray 
    + parts
       .map(formatPart)
       .join("")
       .replace(/\n/g, function() { 
           return "\n" + ("   " + ++line + "| ").substr(-6)
       })
    );

    function formatPart(part) {
        if (part.removed) return part.value.strikethrough.redBG.white;
        if (part.added  ) return part.value.magentaBG.white;  
        return part.value.gray
    }
}


