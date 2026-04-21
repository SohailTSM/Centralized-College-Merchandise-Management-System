const autocannon = require('autocannon');

console.log('Starting Benchmark... Ensure servers are running.');
console.log('We will test the Catalog Service via the API Gateway (Port 5000), which incurs network latency by calling Auth Service (Port 5001).');

const runBenchmark = () => {
  const instance = autocannon({
    url: 'http://localhost:5000/api/merchandise',
    connections: 10,  // concurrent connections
    pipelining: 1,    // requests per connection
    duration: 10,     // 10 seconds experiment
  }, (err, result) => {
    if (err) {
      console.error('Error running benchmark:', err);
      return;
    }
    console.log('\n===== BENCHMARK RESULTS (Microservices) =====');
    console.log(`Requests completed:  ${result.requests.total}`);
    console.log(`Average Latency:     ${result.latency.mean} ms`);
    console.log(`Throughput:          ${result.requests.mean} req/sec`);
    console.log('=============================================');
    
    console.log('\nNOTE for Architecture Analysis:');
    console.log('If you run this against the original monolith (port 5000 on main branch),');
    console.log('Latency will be drastically lower and Throughput much higher because');
    console.log('there are zero internal HTTP hops to verify Auth tokens or proxy requests.');
  });

  autocannon.track(instance, { renderProgressBar: true });
};

runBenchmark();
