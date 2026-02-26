const fs = require('fs');

function addClasses(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');

  // replace button client picker
  c = c.replace(
    /onClick=\{\(\) \=\> setShowClientePicker\(\!showClientePicker\)\}\n\s*style=\{\{/g,
    'className="client-picker-btn"\n              onClick={() => setShowClientePicker(!showClientePicker)}\n              style={{'
  );

  // replace chevron
  c = c.replace(
    /<ChevronDown\n\s*size=\{14\}\n\s*style=\{\{/g,
    '<ChevronDown\n                className="client-picker-chevron"\n                size={14}\n                style={{'
  );

  // replace footer profile
  c = c.replace(
    /<div>\n\s*<div style=\{\{ fontSize: "0\.8rem", fontWeight: 600 \}\}>\n\s*\{profile\?\.full_name \|\| "Admin"\}\n\s*<\/div>/g,
    '<div className="profile-info">\n              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>\n                {profile?.full_name || "Admin"}\n              </div>'
  );
  
  c = c.replace(
    /<div>\n\s*<div style=\{\{ fontSize: "0\.8rem", fontWeight: 600 \}\}>\n\s*\{profile\?\.full_name \|\| "Gestor"\}\n\s*<\/div>/g,
    '<div className="profile-info">\n              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>\n                {profile?.full_name || "Gestor"}\n              </div>'
  );

  fs.writeFileSync(filePath, c);
}

addClasses('src/layouts/AdminLayout.tsx');
try {
  addClasses('src/layouts/ClientLayout.tsx');
} catch (e) { console.log(e.message) }
console.log('done');
