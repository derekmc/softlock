
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
        let skip = false;
        if(k[0] == ":"){
          skip = true;
          k = k.substr(1);
        }
        let v = values[k];
        let r = revisions[k] ?? 0;

        // keys prefixed with ":" return the revision only.
        return_values.push(skip? null : v);
        return_revisions.push(r);
      }
      // if(Math.random() < 0.0001) return no("Not today.");
      return yes(return_values, return_revisions);
    });
  }
  X.set = (locks, ...args) => {
    return new Promise((yes, no) => {
      for(let k in locks){
        let r = revisions[k] ?? 0;
        if(r != locks[k]){
          return no(`Outdated key '${k}'`);
        }
      }
      for(let i=0; i<args.length - 1; i+=2){
        let k = args[i];
        let v = args[i+1];
        values[k] = v;
        revisions[k] = (revisions[k]?? 0) + 1;
      }
      return yes(args.length/2);
    })
  }

  // if the key is a tuple(or has a comma), then the second item is the revision.
  /*
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
  }*/
  return X;
}


// this is the client/server combo
function softlock(){

  let X = {};
  let __config
  let config_props = {};
  let db = kvrev();
  

  X.config = function(k, v){
    if(!(k in config_props){
      return false; }
    __config[k] = v;
  }


  X.query = function(){
    let Q = {};
    let values = {};
    let locked_revisions = {};
    let getitems = {};
    let lockitems = {};
    let peekitems = {};
    let assign = {};

    Q.ready = false;
    Q.finished = false;
    Q.values = {};
    Q.revisions = {};

    Q.lock = function(...args){
      for(let i=0; i<args.length; ++i){
        lockitems[args[i]] = true;
      }
    }
    Q.get = function(...args){
      for(let i=0; i<args.length; ++i){
        getitems[args[i]] = true;
      }
    }
    Q.peek = function(...args){
      for(let i=0; i<args.length; ++i){
        peekitems[args[i]] = true;
      }
    }
    Q.set = function(...args){
      for(let i=0; i<args.length - 1; ++i){
        assign[args[i]] = args[i+1];
      }
    }



    // this is the only promise function in the interface.
    Q.submit = function(){
      if(Q.ready){
        return new Promise((yes, no) => {
          Q.ready = false;
          db.set(locked_revisions, ...assign).then({
            Q.finished = true;
          });
        })
      } else {
        return new Promise((yes, no) => {
          let getargs = [];
          for(let k in getitems){
            getargs.push(k);
          }
          for(let k in peekitems){
            if(!(k in getitems)) getargs.push(k);
          }
          for(let k in lockitems){
            if(!(k in getitems) && !(k in peekitems)){ 
              getargs.push(":" + k); }
          }
          db.get(getargs).then((items, revs)=>{
            Q.ready = true;
            for(let i=0; i<getargs.length; ++i){
              let key = getargs[i];
              if(key[0] == ":") key = key.substr(1);
              let item = items[i];
              let rev = revs[i];
              if((key in getitems) || (key in lockitems)){
                locked_revisions[key] = rev;
              }
            }
          });
        });
      }
    }
    return Q;
  }

  return X;
}

module.imports = softlock;

function main(){
  
}


