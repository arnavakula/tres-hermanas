const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const dest = path.join(__dirname, '..', 'prisma', 'schema.demo.prisma');

let schema = fs.readFileSync(src, 'utf8');

// Switch provider
schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');

// Collect enum names and their values before removing
const enumDefs = {};
const enumRegex = /^enum (\w+) \{([^}]*)\}/gm;
let match;
while ((match = enumRegex.exec(schema)) !== null) {
  enumDefs[match[1]] = match[2].trim().split(/\s+/);
}

// Remove enum blocks
schema = schema.replace(/^enum \w+ \{[^}]*\}\n*/gm, '');

// Replace enum type references with String in field declarations
for (const enumName of Object.keys(enumDefs)) {
  // Match field type usage: spaces + EnumName + (space or newline)
  schema = schema.replace(
    new RegExp(`(\\s+)${enumName}(\\s)`, 'g'),
    '$1String$2'
  );
}

// Quote bare enum values in @default(): e.g. @default(EMPLOYEE) -> @default("EMPLOYEE")
// Collect all enum values
const allEnumValues = new Set();
for (const values of Object.values(enumDefs)) {
  for (const v of values) allEnumValues.add(v);
}
schema = schema.replace(/@default\((\w+)\)/g, (full, val) => {
  if (allEnumValues.has(val)) return `@default("${val}")`;
  return full;
});

fs.writeFileSync(dest, schema);
console.log('Generated', dest);
