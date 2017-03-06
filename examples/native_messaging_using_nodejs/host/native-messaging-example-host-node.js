process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write(chunk);
  }
});

process.stdin.on('end', () => {
  process.stdout.write(JSON.stringify({text:'end'}));
});
