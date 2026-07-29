const fs = require('fs');

const files = [
  'src/app/api/export/route.ts',
  'src/app/api/import/confirm/route.ts',
  'src/app/api/import/preview/route.ts',
  'src/app/api/items/route.ts',
  'src/app/api/reports/route.ts',
  'src/app/api/stats/route.ts',
  'src/app/api/versions/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const target = "export const dynamic = 'force-dynamic'";
  const lastIndex = content.lastIndexOf(target);
  if (lastIndex !== -1 && lastIndex !== content.indexOf(target)) {
    content = content.substring(0, lastIndex) + content.substring(lastIndex + target.length);
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Skipped ${file}`);
  }
}
