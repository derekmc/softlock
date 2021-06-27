
let test = new Promise((yes, no) => {
  return yes();
  let a = yes();
  console.log('a: ', a);
  let b = no();
  console.log('b: ', b);
});

(async ()=> {
  await test;
  console.log('here');
})()
// test.then(()=> console.log('finished.'));
