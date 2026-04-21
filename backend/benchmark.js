const autocannon = require('autocannon');

console.log('Starting Benchmark... Ensure monolithic server is running on port 5000.');
console.log('We will test the Catalog Service directly inside the monolith, requiring no network hops.');

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
    console.log('\n===== BENCHMARK RESULTS (Monolith) =====');
    console.log(`Requests completed:  ${result.requests.total}`);
    console.log(`Average Latency:     ${result.latency.mean} ms`);
    console.log(`Throughput:          ${result.requests.mean} req/sec`);
    console.log('========================================');
    
    console.log('\nNOTE for Architecture Analysis:');
    console.log('Compare these results to the Microservices split.');
    console.log('The Monolith should report vastly higher throughput and lower latency.');
  });

  autocannon.track(instance, { renderProgressBar: true });
};

runBenchmark();
