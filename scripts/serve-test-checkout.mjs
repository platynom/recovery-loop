import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifestPath = resolve(process.argv[2] ?? '');
if (!manifestPath) throw new Error('Pass a guarded Checkout manifest path.');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!String(manifest.keyId).startsWith('rzp_test_')) throw new Error('ABORT: checkout key is not an rzp_test_ key.');
const port = Number(process.env.TEST_CHECKOUT_PORT ?? 3002);
const safeJson = JSON.stringify(manifest).replaceAll('<', '\\u003c');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Recovery Loop Test Checkout</title><script src="https://checkout.razorpay.com/v1/checkout.js"></script></head><body><main><h1>Recovery Loop genuine test lab</h1><p>Guard: <strong>rzp_test_ asserted</strong></p><div id="status">Ready</div></main><script>
const manifest=${safeJson};
if(!manifest.keyId.startsWith('rzp_test_')) throw new Error('ABORT: non-test key');
const sequence=Number(new URLSearchParams(location.search).get('sequence'));
const order=manifest.orders.find(item=>item.sequence===sequence);
if(!order) throw new Error('Unknown sequence');
document.querySelector('#status').textContent='Opening '+order.instrument;
const checkout=new Razorpay({key:manifest.keyId,order_id:order.id,amount:order.amount,currency:'INR',name:'Recovery Loop Test Lab',description:order.instrument,prefill:{name:'Test Customer',email:'recovery-loop-test@example.com',contact:'9000090000'},notes:{recovery_loop_run:manifest.runId,recovery_loop_sequence:String(sequence),expected_result:'failure',test_instrument:order.instrument},handler:(response)=>{document.querySelector('#status').textContent='Completed '+JSON.stringify(response);}});
checkout.on('payment.failed',response=>{document.querySelector('#status').textContent='Failed '+JSON.stringify(response.error);});
checkout.open();
</script></body></html>`;

createServer((request, response) => {
  if (request.method !== 'GET' || !request.url?.startsWith('/?sequence=')) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(html);
}).listen(port, '127.0.0.1', () => console.log(`Guarded test Checkout: http://127.0.0.1:${port}/?sequence=1`));
