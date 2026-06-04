const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/chyed/Downloads/2025YearlyProject-Team5-development/2025YearlyProject-Team5-development/frontend/src');
let changedFiles = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace visible={...} with open={...} for Modal component
  // Because Modal can span multiple lines, we use [\s\S]
  // regex: /(<Modal[\s\S]*?)\bvisible(\s*=\s*[\{|"])/g
  const newContent = content.replace(/(<Modal[\s\S]*?)\bvisible(\s*=\s*[\{|"])/g, '$1open$2');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log('Updated:', file);
  }
});
console.log('Total files changed:', changedFiles);
