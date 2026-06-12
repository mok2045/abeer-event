<?php
set_time_limit(60);
$base = 'https://raw.githubusercontent.com/mok2045/abeer-event/main/';
$files = [
  'index.html' => __DIR__.'/index.html',
  'assets/css/styles.css' => __DIR__.'/assets/css/styles.css',
];
foreach ($files as $url => $path) {
  $content = file_get_contents($base.$url);
  if ($content && file_put_contents($path, $content)) echo "✅ $url updated\n";
  else echo "❌ $url FAILED\n";
}
unlink(__FILE__);
echo "\nDone!";
