// Create scripts directory if it doesn't exist
const fs = require('fs');
const path = require('path');

// Path to the web build directory
const webBuildDir = path.join(__dirname, '..', 'web-build');

// Create 404.html file that redirects to index.html with the original URL parameters
const redirectContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Student Attendance Dashboard</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages
      // MIT License
      // https://github.com/rafgraph/spa-github-pages
      // This script takes the current url and converts the path and query
      // string into just a query string, and then redirects the browser
      // to the new url with only a query string and hash fragment
      
      // If you're creating a Project Pages site and NOT using a custom domain,
      // then set pathSegmentsToKeep to 1 (enterprise users may need to set it to > 1).
      var pathSegmentsToKeep = 1;

      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
    Redirecting...
  </body>
</html>
`;

// Modify the index.html to handle redirects
try {
  // Check if web-build directory exists
  if (!fs.existsSync(webBuildDir)) {
    console.error('Error: web-build directory does not exist. Run "npm run export-web" first.');
    process.exit(1);
  }

  // Create 404.html
  fs.writeFileSync(path.join(webBuildDir, '404.html'), redirectContent);
  console.log('Created 404.html redirect file');

  // Now update index.html to handle the redirect
  const indexPath = path.join(webBuildDir, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add the redirect script right after the opening head tag
  const redirectScript = `
  <script type="text/javascript">
    // Single Page Apps for GitHub Pages
    // MIT License
    // https://github.com/rafgraph/spa-github-pages
    (function(l) {
      if (l.search[1] === '/' ) {
        var decoded = l.search.slice(1).split('&').map(function(s) { 
          return s.replace(/~and~/g, '&')
        }).join('?');
        window.history.replaceState(null, null,
            l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location))
  </script>
  `;
  
  // Check if redirect script is already in the file
  if (!indexContent.includes("Single Page Apps for GitHub Pages")) {
    indexContent = indexContent.replace('<head>', '<head>' + redirectScript);
    fs.writeFileSync(indexPath, indexContent);
    console.log('Updated index.html with SPA redirect handler');
  } else {
    console.log('index.html already has the SPA redirect handler');
  }
} catch (err) {
  console.error('Error creating redirect files:', err);
  process.exit(1);
}