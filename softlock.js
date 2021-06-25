
function assert(test, message){
  if(!message) message = "Assertion failed.";
  if(!test) throw new Error(message);
}
// this is the server only.
function kvrev(){
  let X = {};
  let values = {};
  let revisions = {};

  // revisions
  X.get = (...args) => {
    return new Promise((yes, no) => {
      let return_values = [];
      let return_revisions = [];
      for(let i=0; i<args.length; ++i){
        let k = args[i];
        let v = values[k];
        let r = revisions[k] ?? 0;

        // keys prefixed with "#" return the revision only.
        return_values.push(v);
        return_revisions.push(r);
      }
      // if(Math.random() < 0.0001) return no("Not today.");
      return yes(return_values, return_revisions);
    });
  }
  // if the key is a tuple(or has a comma), then the second item is the revision.
  X.set = (...args) => {
    return new Promise((yes, no) => {
      let changes = [];
      for(let i=0; i<args.length - 1; i+=2){
        let key = args[i];
        let value = args[i+1];
        let revision = null;
        if(typeof key == "string"){
          let j = key.indexOf(",");
          if(j >= 0){
            revision = parseInt(key.substring(j+1));
            key = key.substring(0,j);
          }
        } else if(Array.isArray(key)){
          revision = key[1];
          key = key[0];
        }
        assert(typeof key == "string");
        if(revision !== null && revision != revisions[k]){
          return no(`Outdated key '${k}'`);
        } else {
          changes.push(key, value);
        }
      }
      for(let i=0; i<changes.length-1; i+=2){
        let k = changes[i];
        let v = changes[i+1];
        values[k] = v;
        revisions[k] = (revisions[k]?? 0) + 1;
      }
      return yes(changes.length/2);
    });
  }
  return X;
}


// this is the client/server combo
function softlock(){
  let X = {};
  let __config
  let config_props = {};
  let db = kvrev();

  X.query = function(){
    let Q = {};
    let values = {};
    let revisions = {};
    let changes = [];
    let tolock = {};

    Q.ready = false;

    Q.submit = function(){
      return new Promise((yes, no) => {
        db.get(
      });
    }
    Q.lock = function(...args){
      
      
    }
    Q.get = function(){
    }
    Q.peek = function(){
    }

    return Q;
  }
  X.config = function(k, v){
    if(!(k in config_props){
      return false; }
    __config[k] = v;
  }

  return X;
}

module.imports = softlock;

function main(){
  
}


